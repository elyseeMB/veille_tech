import os
import json
import requests
from json_repair import repair_json
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from typing import List
from pydantic import BaseModel
from shared import Result, NamingResult
from logger import get_logger

log = get_logger("processing.naming")


class NamingInput(BaseModel):
    titles: List[str]
    excerpts: List[str] = []


def extract_first_json(text: str) -> dict:
    repaired = repair_json(text)
    return json.loads(repaired)


class ClusterNamer:
    __url: str
    __headers: dict

    def __init__(self, account_id: str, api_token: str):
        is_prod = os.getenv("ENVIRONMENT") == "production"
        model = (
            "llama-3.3-70b-instruct-fp8-fast" if is_prod else "llama-3.1-8b-instruct"
        )
        self.__url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/{model}"
        self.__headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }
        log.debug(f"using model: {model}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((requests.RequestException, KeyError)),
    )
    def generate(self, input: NamingInput) -> Result[NamingResult]:
        try:
            log.debug(f"naming cluster — {len(input.titles)} articles")

            system_prompt = (
                "You are a JSON-only API."
                "Respond ONLY with valid JSON matching the schema."
                "Do NOT add explanations, comments, or any text outside the JSON object."
                "Do NOT use markdown or code fences."
            )

            user_prompt = f"""
                You are a semantic labeling engine for a tech news aggregator.

                You receive a set of tech articles sharing a common topic.
                Your job is to identify and name that shared topic with maximum precision.

                ARTICLES:
                {chr(10).join([
                    f"Title: {t}\nExcerpt: {e}\n"
                    for t, e in zip(input.titles, input.excerpts or input.titles)
                ])}

                TASK:
                Produce a label that captures the SPECIFIC subject of these articles.

                SPECIFICITY RULE — the most important rule:
                Given two accurate labels, always pick the more specific one.
                Ask: "Could this label apply to 100 different news cycles?"
                If yes, it is too generic. Go one level deeper.

                LABEL RULES:
                - 2 to 5 words
                - lowercase only
                - no punctuation, no quotes, no dashes, no emojis
                - name the actual subject, not its parent category
                - if a specific technology, protocol, or concept is shared — name it
                - company names are allowed when the cluster is genuinely company-centric

                DESCRIPTION RULES:
                - exactly 1 sentence
                - describes what is happening, not just what the domain is
                - no marketing tone

                OUTPUT FORMAT:
                Respond ONLY with valid JSON. No markdown, no explanation.

                {{
                "label": "specific subject label",
                "description": "One sentence describing what is happening in this topic."
                }}
                """

            response = requests.post(
                self.__url,
                headers=self.__headers,
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.1,
                },
                timeout=120,
            )
            response.raise_for_status()
            data = response.json()

            log.debug(f"full data: {json.dumps(data)[:500]}")

            if not data.get("success", True):
                errors = data.get("errors", [])
                return Result.fail(f"cloudflare error: {errors}")

            raw_response = (
                data["result"].get("response")
                or data["result"]["choices"][0]["message"]["content"]
            )
            log.debug(
                f"raw response: {json.dumps(raw_response) if isinstance(raw_response, dict) else str(raw_response)[:300]}"
            )

            if isinstance(raw_response, dict):
                result_json = raw_response
            else:
                result_json = extract_first_json(raw_response.strip())

            raw_desc = result_json.get("description", "")
            label = self._clean_label(result_json.get("label", "Unnamed Cluster"))

            log.info(f"cluster named: '{label}'")
            log.debug(f"description: {raw_desc}")

            return Result.ok(
                NamingResult(
                    label=label,
                    description=(
                        raw_desc if isinstance(raw_desc, str) else str(raw_desc)
                    ),
                )
            )
        except Exception as e:
            log.error(f"naming error: {e}")
            return Result.fail(f"naming and description error: {e}")

    def _clean_label(self, label: str) -> str:
        label = label.replace('"', "").replace("'", "").lstrip("- ").strip()

        for prefix in ["label:", "label :", "here is", "response:", "category:"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix) :].strip()

        words = label.split()[:4]
        return " ".join(words) if words else "Unnamed Cluster"
