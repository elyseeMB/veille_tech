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

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((requests.RequestException, KeyError)),
    )
    def generate(self, input: NamingInput) -> Result[NamingResult]:
        try:
            system_prompt = (
                "You are a JSON-only API."
                "Respond ONLY with valid JSON matching the schema."
                "Do NOT add explanations, comments, or any text outside the JSON object."
                "Do NOT use markdown or code fences."
            )

            user_prompt = f"""
                You are an expert semantic clustering engine for a technology intelligence platform.

                Your task is to analyze multiple tech articles and infer the SINGLE dominant shared topic.

                The goal is NOT summarization.
                The goal is taxonomy-quality semantic labeling.

                ARTICLES:
                {chr(10).join([
                    f"Title: {t}\nExcerpt: {e}\n"
                    for t, e in zip(input.titles, input.excerpts or input.titles)
                ])}

                INSTRUCTIONS:

                1. Detect the COMMON underlying theme across MOST articles.
                2. Infer the broader technical domain or trend.
                3. Prioritize semantic meaning over repeated wording.
                4. Avoid copying article titles directly.
                5. Ignore hype wording, announcements, and marketing language.
                6. Ignore company names unless the cluster is explicitly company-centric.
                7. Prefer stable taxonomy labels reusable over time.
                8. Use terminology commonly understood by developers and tech professionals.
                9. The label should feel like a category name, not a headline.
                10. If multiple subtopics exist, choose the strongest shared denominator.

                LABEL RULES:
                - 2 to 4 words maximum
                - lowercase only
                - no punctuation
                - no quotes
                - no dashes
                - no emojis
                - avoid vague wording
                - avoid temporal wording
                - avoid generic labels like:
                - ai news
                - tech updates
                - software trends
                - innovation
                - startups

                GOOD LABEL EXAMPLES:
                - llm agents
                - vector databases
                - browser automation
                - edge computing
                - developer tooling
                - cloud security
                - realtime rendering
                - ai infrastructure
                - robotics automation
                - wasm tooling
                - distributed systems
                - observability platforms
                - inference optimization
                - ai coding tools

                BAD LABEL EXAMPLES:
                - openai launch
                - new ai release
                - latest technology
                - github copilot update
                - exciting innovation
                - startup funding
                - anthropic model

                DESCRIPTION RULES:
                - exactly 1 sentence
                - concise but informative
                - describe the broader topic
                - do NOT mention "articles"
                - do NOT mention titles
                - do NOT explain clustering
                - no marketing tone

                OUTPUT FORMAT:
                Respond ONLY with valid JSON.

                {{
                "label": "semantic cluster label",
                "description": "Concise semantic summary of the shared topic."
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
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("success", True):
                errors = data.get("errors", [])
                return Result.fail(f"cloudflare error: {errors}")

            raw_response = data["result"]["response"]

            if isinstance(raw_response, dict):
                result_json = raw_response
            else:
                result_json = extract_first_json(raw_response.strip())

            raw_desc = result_json.get("description", "")
            return Result.ok(
                NamingResult(
                    label=self._clean_label(
                        result_json.get("label", "Unnamed Cluster")
                    ),
                    description=(
                        raw_desc if isinstance(raw_desc, str) else str(raw_desc)
                    ),
                )
            )
        except Exception as e:
            return Result.fail(f"naming and description error: {e}")

    def _clean_label(self, label: str) -> str:
        label = label.replace('"', "").replace("'", "").lstrip("- ").strip()

        for prefix in ["label:", "label :", "here is", "response:", "category:"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix) :].strip()

        words = label.split()[:4]
        return " ".join(words) if words else "Unnamed Cluster"
