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
                "You are a JSON-only API. "
                "Respond ONLY with valid JSON matching the schema. "
                "Do NOT add explanations, comments, or any text outside the JSON object. "
                "Do NOT use markdown or code fences."
            )

            user_prompt = f"""Analyze these tech articles and find their common theme:

{chr(10).join([f"Title: {t}\nExcerpt: {e[:1500]}\n" for t, e in zip(input.titles, input.excerpts or input.titles)])}

Respond ONLY with this JSON object:
{{
  "label": "3-4 words max, NO dash, the common topic",
  "description": "2 sentences max about the common theme, written as a topic summary, do not start with 'These articles' or 'The articles'."
}}"""

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

            # Cloudflare JSON mode retourne parfois un dict directement
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
