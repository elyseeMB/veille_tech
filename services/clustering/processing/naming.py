import json
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


def extract_first_json(text: str) -> dict:
    """Extrait le premier objet JSON valide d'une string,
    même si le modèle hallucine du texte autour ou concatène plusieurs objets."""
    depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == '{':
            if start is None:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                candidate = text[start:i + 1]
                return json.loads(candidate)
    raise ValueError(f"Aucun objet JSON valide trouvé dans la réponse : {text!r}")


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
            system_prompt = (
                "You are a data classification bot. "
                "Analyze tech article titles and return a JSON object with a concise "
                "category name (4 words max) and a brief description summarizing the theme."
            )

            user_prompt = f"""Analyze these tech article titles:
            {chr(10).join([f"- {t}" for t in input.titles])}

            You MUST respond with a raw JSON object following this exact structure, with no formatting markdown block like ```json:
            {{
            "label": "Name of the category",
            "description": "Brief summary sentence explaining the common technical theme of these articles."
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
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            raw_response = data["result"]["response"].strip()

            # Nettoyage des backticks si le modèle les ajoute malgré tout
            if raw_response.startswith("```"):
                lines = raw_response.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_response = "\n".join(lines).strip()

            # Extraction robuste : s'arrête au premier objet JSON complet,
            # ignore tout texte parasite avant/après ou les objets JSON multiples
            result_json = extract_first_json(raw_response)

            return Result.ok(
                NamingResult(
                    label=self._clean_label(
                        result_json.get("label", "Unnamed Cluster")
                    ),
                    description=result_json.get("description", "").strip(),
                )
            )
        except Exception as e:
            return Result.fail(f"naming and description error: {e}")

    def _clean_label(self, label: str) -> str:
        # Nettoie les guillemets et puces parasites que le modèle peut renvoyer
        label = label.replace('"', "").replace("'", "").lstrip("- ").strip()

        for prefix in ["label:", "label :", "here is", "response:", "category:"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix):].strip()

        # 4 mots max
        words = label.split()[:4]
        return " ".join(words) if words else "Unnamed Cluster"