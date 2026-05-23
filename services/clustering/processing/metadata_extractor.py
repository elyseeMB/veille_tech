import os
import json
from json_repair import repair_json
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
import requests
from logger import get_logger
from pydantic import BaseModel
from typing import List
from shared import Result, MetadataResult

log = get_logger("processing.metadata_extractor")


def extract_first_json(text: str) -> dict:
    repaired = repair_json(text)
    return json.loads(repaired)


class MetadataInput(BaseModel):
    title: str
    chunks: List[str]


class MetadataExtractor:
    __url: str
    __headers: dict

    def __init__(self, account_id: str, api_token: str):
        is_prod = os.getenv("ENVIRONMENT") == "production"
        model = "qwen/qwen3-30b-a3b-fp8"
        self.__url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/{model}"
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
    def extract(self, article: MetadataInput) -> Result[MetadataResult]:
        log.debug(f"info article: {article}")

        full_text = "\n".join(article.chunks)
        log.debug(f"Payload content length: {len(full_text)}")

        if not full_text.strip():
            return Result.fail("Metadata extraction failed: article content is empty")
        try:
            log.debug(f"extracting metadata from article: {article.title}")

            system_prompt = (
                "You are a JSON-only API."
                "Respond ONLY with valid JSON matching the schema."
                "Do NOT add explanations, comments, or any text outside the JSON object."
                "Do NOT use markdown or code fences."
            )

            user_prompt = f"""
            Analyze the following article and extract precise metadata.

            Title: {article.title}
            Content:
            {full_text}

            Respond strictly with a JSON object containing:
            - "main_topic": the SPECIFIC technology, product, event, or incident discussed.
            NOT a category. NOT a domain.
            Always prefer: "[product] [version] release", "[group] [platform] attack", "[company A] [company B] acquisition"

            - "keywords": 3 to 5 SPECIFIC named entities only.
            Include: [product names], [company names], [protocol names], [CVE IDs], [version numbers], [person names]
            Exclude generic words — only named entities.
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
            log.debug(f"full response: {json.dumps(data)}")

            log.debug(f"full data: {json.dumps(data)[:500]}")

            if not data.get("success", True):
                errors = data.get("errors", [])
                return Result.fail(f"cloudflare error: {errors}")

            result = data.get("result")

            if not result:
                log.error(f"cloudflare returned null result: {json.dumps(data)[:300]}")
                return Result.fail("cloudflare returned null result")

            raw_response = result["choices"][0]["message"]["content"]

            if not raw_response:
                log.error(f"empty content in response: {json.dumps(data)[:300]}")
                return Result.fail("empty content in response")

            log.debug(f"raw response: {str(raw_response)[:300]}")

            if isinstance(raw_response, dict):
                result_json = raw_response
            else:
                result_json = extract_first_json(raw_response.strip())

            main_topic = result_json.get("main_topic", "")
            keywords = result_json.get("keywords", [])

            return Result.ok(
                MetadataResult(
                    main_topic=str(main_topic) if main_topic else "Unknown",
                    keywords=keywords if isinstance(keywords, list) else [],
                )
            )
        except Exception as e:
            log.error(f"extraction error: {e}")
            return Result.fail(f"metadata extraction error: {e}")
