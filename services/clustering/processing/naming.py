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
            system_prompt = "You are a data classification bot. Your job is to extract a single concise tech category from a list of titles. You must output ONLY the category name. No punctuation, no quotes, no numbers, no conversational text."

            user_prompt = f"""Analyze these tech article titles:
            {chr(10).join([f"- {t}" for t in input.titles])}

            Examples of expected outputs:
            - AI Industry Trends
            - Cloud Infrastructure Security
            - Frontend Frameworks
            - Space Geopolitics

            Output the best neutral, professional label (1 to 4 words max) for the provided titles:"""

            response = requests.post(
                self.__url,
                headers=self.__headers,
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.1,  # Force Llama à être ultra-factuel et direct
                },
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            label = data["result"]["response"].strip()
            label = self._clean_label(label)

            return Result.ok(NamingResult(label=label))
        except Exception as e:
            return Result.fail(f"naming error: {e}")

    def _clean_label(self, label: str) -> str:
        # Nettoie les guillemets et les puces parasites que le modèle peut renvoyer
        label = label.replace('"', "").replace("'", "").lstrip("- ").strip()

        for prefix in ["label:", "label :", "here is", "response:", "category:"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix) :].strip()

        # 4 mots max pour laisser de la place aux vrais termes techniques (ex: Cloud Infrastructure Security)
        words = label.split()[:4]
        return " ".join(words) if words else "Unnamed Cluster"
