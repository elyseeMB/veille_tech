import requests
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


class ClusterNamer:
    __url: str
    __headers: dict

    def __init__(self, account_id: str, api_token: str):
        self.__url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"
        self.__headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((requests.RequestException, KeyError)),
    )
    def name(self, input: NamingInput) -> Result[NamingResult]:
        try:
            system_prompt = "You are a data classification bot. Your job is to analyze tech article titles and return a JSON object containing a concise category name (4 words max) and a brief description (15 to 25 words max) summarizing the main theme."

            user_prompt = f"""Analyze these tech article titles:
{chr(10).join([f"- {t}" for t in input.titles])}

You MUST respond with a JSON object following this exact schema:
{{
  "label": "Name of the category",
  "description": "Brief summary sentence explaining the common technical theme of these articles."
}}

Do not include any conversational text or markdown code blocks outside the JSON."""

            response = requests.post(
                self.__url,
                headers=self.__headers,
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.1,
                    "response_format": {
                        "type": "json_object"
                    },  # Si l'API Cloudflare de ton infra le supporte, sinon laisse Llama le générer
                },
                timeout=30,
            )
            response.raise_for_status()

            import json

            data = response.json()
            raw_response = data["result"]["response"].strip()

            # On parse le JSON renvoyé par l'IA
            result_json = json.loads(raw_response)

            return Result.ok(
                NamingResult(
                    label=self._clean_label(result_json["label"]),
                    description=result_json["description"].strip(),
                )
            )
        except Exception as e:
            return Result.fail(f"naming and description error: {e}")

    def _clean_label(self, label: str) -> str:
        # Nettoie les guillemets et les puces parasites que le modèle peut renvoyer
        label = label.replace('"', "").replace("'", "").lstrip("- ").strip()

        for prefix in ["label:", "label :", "here is", "response:", "category:"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix) :].strip()

        # 4 mots max pour laisser de la place aux vrais termes techniques (ex: Cloud Infrastructure Security)
        words = label.split()[:4]
        return " ".join(words) if words else "Unnamed Cluster"
