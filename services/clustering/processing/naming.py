import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from typing import List
from pydantic import BaseModel
from shared   import Result, NamingResult

class NamingInput(BaseModel):
    titles: List[str]

class ClusterNamer:
    __url:     str
    __headers: dict

    def __init__(self, account_id: str, api_token: str):
        self.__url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"
        self.__headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type":  "application/json"
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((requests.RequestException, KeyError))
    )
    def name(self, input: NamingInput) -> Result[NamingResult]:
        try:
            prompt = f"""Here are tech article titles:
{chr(10).join(input.titles)}

Give a short label (3 words max), neutral and professional.
Only the subject, no judgment, no emotion.
Respond with ONLY the label, nothing else."""

            response = requests.post(
                self.__url,
                headers = self.__headers,
                json    = {"messages": [{"role": "user", "content": prompt}]},
                timeout = 30
            )
            response.raise_for_status()
            data = response.json()
            label = data["result"]["response"].strip()
            label = self._clean_label(label)
            return Result.ok(NamingResult(label=label))
        except Exception as e:
            return Result.fail(f"naming error: {e}")

    def _clean_label(self, label: str) -> str:
        for prefix in ["label:", "label :", "here is", "response:", "response :"]:
            if label.lower().startswith(prefix):
                label = label[len(prefix):].strip()
        words = label.split()[:3]
        return " ".join(words) if words else "Unnamed cluster"
