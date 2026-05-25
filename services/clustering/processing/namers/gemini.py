import json
import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from shared import Result, NamingResult, NamingResultGemini
from logger import get_logger
from processing.namers.base import (
    BaseNamer,
    NamingInput,
    BatchNamingInput,
    BatchNamingResult,
    ClusterInput,
    extract_first_json,
)

log = get_logger("processing.namers.gemini")

GEMINI_MODEL = "google-ai-studio/gemini-2.5-flash"


class GeminiNamer(BaseNamer):
    __url: str
    __headers: dict

    def __init__(
        self,
        account_id: str,
        gateway_name: str,
        cf_api_token_gateway: str,
        gemini_api_key: str,
    ):
        self.__url = (
            f"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}"
            f"/compat/chat/completions"
        )
        self.__headers = {
            "Content-Type": "application/json",
            "cf-aig-authorization": f"Bearer {cf_api_token_gateway}",
            "Authorization": f"Bearer {gemini_api_key}",
        }
        log.debug(f"using model: {GEMINI_MODEL} via Cloudflare AI Gateway")

    def generate(self, input: NamingInput) -> Result[NamingResult]:
        result = self.generate_batch(
            BatchNamingInput(
                clusters=[
                    ClusterInput(
                        index=0,
                        titles=input.titles,
                        excerpts=input.excerpts,
                    )
                ]
            )
        )
        if not result.success:
            return Result.fail(result.error)
        return Result.ok(result.value.results[0])

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=5, max=60),
        retry=retry_if_exception_type(
            (requests.RequestException, KeyError, requests.exceptions.HTTPError)
        ),
    )
    def generate_batch(self, input: BatchNamingInput) -> Result[BatchNamingResult]:
        try:
            log.debug(f"batch naming — {len(input.clusters)} clusters")

            clusters_block = "\n\n".join(
                [
                    f"[{c.index}]\n"
                    + "\n".join(
                        [
                            f"Title: {t}\nExcerpt: {e}"
                            for t, e in zip(c.titles, c.excerpts or c.titles)
                        ]
                    )
                    for c in input.clusters
                ]
            )

            prompt = f"""You are a semantic labeling engine for a tech news aggregator.

            You receive multiple clusters of tech articles. Each cluster shares a common topic.
            Your job is to identify and name each cluster's topic with maximum precision.

            CLUSTERS:
            {clusters_block}

            SPECIFICITY RULE — the most important rule:
            Given two accurate labels, always pick the more specific one.
            Ask: "Could this label apply to 100 different news cycles?"
            If yes, it is too generic. Go one level deeper.

            LABEL RULES:
            - 2 to 4 words maximum
            - lowercase only
            - no punctuation, no quotes, no dashes, no emojis
            - name the actual entity or event — not its parent category
            - ALWAYS prefer a proper noun, product name, company name, or version number
            - "[company] reputation crisis" beats "ai backlash"
            - "[group] supply chain attack" beats "github repository breaches"
            - "[company A] [company B] acquisition" beats "tech and society"

            DESCRIPTION RULES:
            - exactly 1 sentence
            - describes what is happening, not just what the domain is
            - no marketing tone

            OUTPUT FORMAT:
            Respond ONLY with a valid JSON object containing a "results" array.

            {{
                "results": [
                    {{"index": 0, "label": "The cluster title", "description": "A short one-sentence description."}},
                    {{"index": 1, "label": "Another cluster title", "description": "Another short description."}}
                ]
            }}"""

            response = requests.post(
                self.__url,
                headers=self.__headers,
                json={
                    "model": GEMINI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 2000,
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "name": "cluster_naming_results",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "results": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "index": {"type": "integer"},
                                                "label": {"type": "string"},
                                                "description": {"type": "string"},
                                            },
                                            "required": [
                                                "index",
                                                "label",
                                                "description",
                                            ],
                                            "additionalProperties": False,
                                        },
                                    }
                                },
                                "required": ["results"],
                                "additionalProperties": False,
                            },
                            "strict": True,
                        },
                    },
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()

            log.debug(f"full data: {json.dumps(data)[:500]}")

            raw_response = data["choices"][0]["message"]["content"].strip()
            log.debug(f"raw response: {raw_response[:500]}")

            raw_list = extract_first_json(raw_response)

            if isinstance(raw_list, dict):
                raw_list = raw_list.get("results", [])

            if isinstance(raw_list, dict):
                raw_list = [raw_list]

            # FIX : On convertit l'index en int pour sécuriser le tri Python
            if isinstance(raw_list, list):
                try:
                    raw_list = sorted(
                        raw_list,
                        key=lambda x: (
                            int(x.get("index", 0)) if isinstance(x, dict) else 0
                        ),
                    )
                except (ValueError, TypeError):
                    raw_list = sorted(
                        raw_list,
                        key=lambda x: (
                            str(x.get("index", 0)) if isinstance(x, dict) else ""
                        ),
                    )
            else:
                raw_list = []

            expected = {c.index for c in input.clusters}

            # FIX : Sécurisation de la récupération des index pour le set d'évaluation
            got = set()
            for item in raw_list:
                if isinstance(item, dict) and "index" in item:
                    try:
                        got.add(int(item["index"]))
                    except (ValueError, TypeError):
                        pass

            missing = expected - got

            if missing:
                log.warning(f"missing clusters in response: {missing}")
                for idx in missing:
                    raw_list.append(
                        {
                            "index": idx,
                            "label": "Unnamed Cluster",
                            "description": "",
                        }
                    )
                # Re-tri sécurisé après ajout des manquants
                try:
                    raw_list = sorted(
                        raw_list,
                        key=lambda x: (
                            int(x.get("index", 0)) if isinstance(x, dict) else 0
                        ),
                    )
                except (ValueError, TypeError):
                    raw_list = sorted(
                        raw_list,
                        key=lambda x: (
                            str(x.get("index", 0)) if isinstance(x, dict) else ""
                        ),
                    )

            results = [
                NamingResultGemini(
                    index=int(item.get("index", -1)),
                    label=self._clean_label(item.get("label", "Unnamed Cluster")),
                    description=item.get("description", ""),
                )
                for item in raw_list
                if isinstance(item, dict)
            ]

            for r in results:
                log.info(f"cluster named: '{r.label}'")

            return Result.ok(BatchNamingResult(results=results))

        except Exception as e:
            log.error(f"batch naming error: {e}")
            return Result.fail(f"batch naming error: {e}")
