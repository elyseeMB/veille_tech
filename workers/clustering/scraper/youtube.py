import os
import time
import random
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
from youtube_transcript_api.proxies import WebshareProxyConfig
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


class YouTubeScraper(BaseScraper):
    def __init__(self):
        webshare_user = os.environ.get("WEBSHARE_USER")
        webshare_pass = os.environ.get("WEBSHARE_PASS")

        if webshare_user and webshare_pass:
            log.info("YouTube scraper initialized with Webshare proxy")
            self.__api = YouTubeTranscriptApi(
                proxy_config=WebshareProxyConfig(
                    proxy_username=webshare_user,
                    proxy_password=webshare_pass,
                )
            )
        else:
            log.info("YouTube scraper initialized without proxy")
            self.__api = YouTubeTranscriptApi()

    def scrape(self, video_id: str) -> Result[ScrapedVideo]:
        # ← pause aléatoire avant chaque requête
        delay = random.uniform(2, 8)
        log.debug(f"waiting {delay:.1f}s before fetching {video_id}")
        time.sleep(delay)

        return self._fetch_with_backoff(video_id)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=60, max=3600),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def _fetch_with_backoff(self, video_id: str) -> Result[ScrapedVideo]:
        log.debug(f"fetching transcript for {video_id}")
        try:
            fetched = self.__api.fetch(video_id, languages=["fr", "en"])
            segments = fetched.to_raw_data()
            blocks = self._group_by_time(segments)
            full_text = "\n\n".join(blocks)
            log.debug(
                f"transcript fetched — {len(segments)} segments, {len(blocks)} blocks, {len(full_text)} chars"
            )
            return Result.ok(ScrapedVideo(video_id=video_id, full_text=full_text))

        except TranscriptsDisabled:
            log.warning(f"transcripts disabled: {video_id}")
            return Result.fail(f"transcripts disabled: {video_id}")
        except NoTranscriptFound:
            log.warning(f"no transcript fr/en: {video_id}")
            return Result.fail(f"no transcript fr/en: {video_id}")
        except VideoUnavailable:
            log.warning(f"video unavailable: {video_id}")
            return Result.fail(f"video unavailable: {video_id}")
        except Exception as e:
            log.error(f"youtube scrape error {video_id}: {e}")
            raise

    def _group_by_time(self, segments: list[dict], window: int = 30) -> list[str]:
        blocks: list[str] = []
        current: list[dict] = []
        start: float = segments[0]["start"]

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
