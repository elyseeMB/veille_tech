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
from logger import get_logger

log = get_logger("processing.article")


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
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=5, max=30),
        retry=retry_if_exception_type(
            (requests.RequestException, KeyError, requests.exceptions.HTTPError)
        ),
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
        except requests.exceptions.HTTPError as e:
            log.error(
                f"Cloudflare HTTP error {response.status_code}: {response.text[:300]}"
            )
            raise

        try:
            data = response.json()
            log.debug(f"vector dimensions: {len(data['result']['data'][0])}")
            return Result.ok(EmbeddingResult(vectors=data["result"]["data"]))
        except Exception as e:
            return Result.fail(f"embedding error: {e}")

    def embed_in_batches(
        self, texts: List[str], batch_size: int = 32
    ) -> Result[EmbeddingResult]:
        log.info(f"embedding {len(texts)} chunks in batches of {batch_size}")
        try:
            all_vectors = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]

                log.debug(
                    f"batch {i//batch_size + 1}/{-(-len(texts)//batch_size)} — {len(batch)} chunks"
                )

                result = self.embed(EmbeddingInput(texts=batch))
                if not result.success:
                    log.error(f"batch {i} error: {result.error}")

                    return Result.fail(f"batch {i} error: {result.error}")

                all_vectors.extend(result.value.vectors)
                log.info(f"embeddings done — {len(all_vectors)} vectors")
            return Result.ok(EmbeddingResult(vectors=all_vectors))
        except Exception as e:
            log.error(f"batch embedding error: {e}")
            return Result.fail(f"batch embedding error: {e}")
