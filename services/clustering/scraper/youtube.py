import os
import time
import random
import html
import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from scraper.base import BaseScraper, ScrapedVideo
from shared import Result
from logger import get_logger

log = get_logger("scraper.youtube")


def get_wait_strategy(retry_state):
    provider = os.environ.get("YOUTUBE_SCRAPER_PROVIDER", "supadata").lower()
    if provider == "supadata":
        return wait_exponential(min=2, max=30)(retry_state)
    else:
        return wait_exponential(min=60, max=3600)(retry_state)


class YouTubeScraper(BaseScraper):
    def __init__(self):
        self.__provider = os.environ.get("YOUTUBE_SCRAPER_PROVIDER", "supadata").lower()
        self.__supadata_key = os.environ.get("SUPADATA_API_KEY")
        self.__supadata_url = "https://api.supadata.ai/v1/youtube/transcript"
        self.__rapidapi_key = os.environ.get("RAPIDAPI_KEY")

        log.info(f"YouTube scraper initialized with provider: {self.__provider}")

        if self.__provider == "supadata" and not self.__supadata_key:
            log.warning("Provider is set to Supadata but SUPADATA_API_KEY is missing!")
        if not self.__rapidapi_key:
            log.warning("RAPIDAPI_KEY is missing, fallback will not work!")

    def scrape(self, video_id: str) -> Result[ScrapedVideo]:
        delay = random.uniform(2, 5)
        log.debug(f"waiting {delay:.1f}s before fetching {video_id}")
        time.sleep(delay)

        return self._fetch_from_provider(video_id)

    @retry(
        stop=stop_after_attempt(3),
        wait=get_wait_strategy,
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def _fetch_from_provider(self, video_id: str) -> Result[ScrapedVideo]:
        if self.__provider == "supadata":
            res = self._scrape_with_supadata(video_id)
            if res.success:
                return res
            log.warning(f"Supadata failed ({res.error}), falling back to RapidAPI")

        return self._scrape_with_rapidapi(video_id)

    def _scrape_with_supadata(self, video_id: str) -> Result[ScrapedVideo]:
        log.debug(f"fetching transcript from Supadata for {video_id}")
        if not self.__supadata_key:
            return Result.fail("Supadata API key is missing")

        try:
            response = requests.get(
                self.__supadata_url,
                params={"url": f"https://www.youtube.com/watch?v={video_id}"},
                headers={"x-api-key": self.__supadata_key},
                timeout=15,
            )

            if response.status_code == 206:
                return Result.fail(f"transcripts unavailable on Supadata (206)")

            # Intercepte toutes les autres erreurs (401, 403, 429, 500...)
            if response.status_code != 200:
                return Result.fail(f"Supadata HTTP {response.status_code}")

            data = response.json()
            segments = data.get("content", [])
            if not segments:
                return Result.fail(f"empty transcript from Supadata: {video_id}")

            standard_segments = []
            for seg in segments:
                standard_segments.append(
                    {
                        "text": html.unescape(seg.get("text", "")),
                        "start": float(seg.get("offset", 0)) / 1000.0,
                    }
                )

            blocks = self._group_by_time(standard_segments)
            full_text = "\n\n".join(blocks)
            return Result.ok(ScrapedVideo(video_id=video_id, full_text=full_text))

        except Exception as e:
            log.error(f"Supadata connection/unexpected error for {video_id}: {e}")
            return Result.fail(f"Supadata failure: {e}")

    def _scrape_with_rapidapi(self, video_id: str) -> Result[ScrapedVideo]:
        log.debug(
            f"fetching transcript from RapidAPI (youtube-transcriptor) for {video_id}"
        )
        if not self.__rapidapi_key:
            return Result.fail("RapidAPI key is missing, fallback impossible")

        url = "https://youtube-transcriptor.p.rapidapi.com/transcript"

        try:
            response = requests.get(
                url,
                params={"video_id": video_id},
                headers={
                    "x-rapidapi-key": self.__rapidapi_key,
                    "x-rapidapi-host": "youtube-transcriptor.p.rapidapi.com",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )

            if response.status_code in (401, 403):
                return Result.fail("RapidAPI 403: Invalid API Key or Unauthorized")

            if response.status_code == 429:
                return Result.fail("RapidAPI 429: Rate Limit / Quota Exceeded")

            if response.status_code in (400, 404):
                return Result.fail(f"No transcripts found on RapidAPI for {video_id}")

            if response.status_code >= 500:
                return Result.fail(
                    f"RapidAPI upstream provider error (HTTP {response.status_code})"
                )

            response.raise_for_status()
            data = response.json()

            if not isinstance(data, list) or len(data) == 0:
                if isinstance(data, dict):
                    error_msg = (
                        data.get("message")
                        or data.get("error")
                        or "Unknown provider error"
                    )
                    return Result.fail(f"RapidAPI provider error payload: {error_msg}")
                return Result.fail(
                    f"Unexpected JSON structure from RapidAPI for {video_id}"
                )

            video_data = data[0]
            if "transcription" not in video_data or video_data["transcription"] is None:
                return Result.fail(
                    f"Missing 'transcription' field in payload for {video_id}"
                )

            segments = video_data.get("transcription", [])
            if not segments:
                return Result.fail(
                    f"Empty transcript array from RapidAPI for {video_id}"
                )

            standard_segments = []
            for seg in segments:
                if not isinstance(seg, dict):
                    continue

                raw_text = seg.get("subtitle", "")
                text_content = html.unescape(raw_text).strip()
                start_time = seg.get("start")

                if text_content and start_time is not None:
                    try:
                        standard_segments.append(
                            {
                                "text": text_content,
                                "start": float(start_time),
                            }
                        )
                    except (ValueError, TypeError):
                        continue

            if not standard_segments:
                return Result.fail(
                    f"No valid text segments could be parsed for {video_id}"
                )

            blocks = self._group_by_time(standard_segments)
            return Result.ok(
                ScrapedVideo(video_id=video_id, full_text="\n\n".join(blocks))
            )

        except requests.exceptions.Timeout:
            return Result.fail(f"RapidAPI timeout for {video_id}")
        except Exception as e:
            log.error(f"RapidAPI parsing/network error for {video_id}: {e}")
            return Result.fail(f"RapidAPI unexpected failure: {e}")

    def _scrape_with_native(self, video_id: str) -> Result[ScrapedVideo]:
        log.debug(f"fetching transcript natively (lazy loaded) for {video_id}")

        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import (
            TranscriptsDisabled,
            NoTranscriptFound,
            VideoUnavailable,
        )
        from youtube_transcript_api.proxies import WebshareProxyConfig

        webshare_user = os.environ.get("WEBSHARE_USER")
        webshare_pass = os.environ.get("WEBSHARE_PASS")

        if webshare_user and webshare_pass:
            api = YouTubeTranscriptApi(
                proxy_config=WebshareProxyConfig(
                    proxy_username=webshare_user,
                    proxy_password=webshare_pass,
                )
            )
        else:
            api = YouTubeTranscriptApi()

        try:
            fetched = api.fetch(video_id, languages=["fr", "en"])
            segments = fetched.to_raw_data()

            standard_segments = []
            for seg in segments:
                standard_segments.append(
                    {
                        "text": html.unescape(seg.get("text", "")),
                        "start": float(seg.get("start", 0.0)),
                    }
                )

            blocks = self._group_by_time(standard_segments)
            full_text = "\n\n".join(blocks)
            return Result.ok(ScrapedVideo(video_id=video_id, full_text=full_text))

        except TranscriptsDisabled:
            return Result.fail(f"transcripts disabled: {video_id}")
        except NoTranscriptFound:
            return Result.fail(f"no transcript fr/en: {video_id}")
        except VideoUnavailable:
            return Result.fail(f"video unavailable: {video_id}")
        except Exception as e:
            log.error(f"native youtube scrape error {video_id}: {e}")
            raise

    def _group_by_time(self, segments: list[dict], window: int = 30) -> list[str]:
        if not segments:
            return []

        blocks: list[str] = []
        current: list[dict] = []
        start = segments[0]["start"]

        for seg in segments:
            if seg["text"].startswith("["):
                continue
            if seg["start"] - start > window:
                blocks.append(" ".join(s["text"] for s in current))
                current, start = [], seg["start"]
            current.append(seg)

        if current:
            blocks.append(" ".join(s["text"] for s in current))

        return blocks
