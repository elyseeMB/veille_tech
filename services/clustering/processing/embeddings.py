import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from typing import List
from pydantic import BaseModel
from shared import Result, EmbeddingResult


class EmbeddingInput(BaseModel):
    texts: List[str]


class CloudflareEmbedder:
    __url: str
    __headers: dict

    def __init__(self, account_id: str, api_token: str):
        self.__url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/baai/bge-m3"
        self.__headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((requests.RequestException, KeyError)),
    )
    def embed(self, input: EmbeddingInput) -> Result[EmbeddingResult]:
        try:
            response = requests.post(
                self.__url,
                headers=self.__headers,
                json={"text": input.texts},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            return Result.ok(EmbeddingResult(vectors=data["result"]["data"]))
        except Exception as e:
            return Result.fail(f"embedding error: {e}")

    def embed_in_batches(
        self, texts: List[str], batch_size: int = 50
    ) -> Result[EmbeddingResult]:
        try:
            all_vectors = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                result = self.embed(EmbeddingInput(texts=batch))
                if not result.success:
                    return Result.fail(f"batch {i} error: {result.error}")
                all_vectors.extend(result.value.vectors)
            return Result.ok(EmbeddingResult(vectors=all_vectors))
        except Exception as e:
            return Result.fail(f"batch embedding error: {e}")
