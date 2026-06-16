import requests
import trafilatura
from urllib.parse import urlparse
from scraper.base import BaseScraper, ScrapedArticle
from shared import Result
from logger import get_logger
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="newspaper")
log = get_logger("scrapper.article")

NEWSPAPER_DOMAINS = ["arstechnica.com"]

NON_HTML_CONTENT_TYPES = (
    "application/pdf",
    "application/octet-stream",
    "application/zip",
)


def _parsing_url(url: str) -> bool:
    domain = urlparse(url).netloc
    return any(d in domain for d in NEWSPAPER_DOMAINS)


def _is_non_html_content(url: str) -> bool:
    try:
        resp = requests.head(url, timeout=5, allow_redirects=True)
        content_type = resp.headers.get("Content-Type", "").lower()
        return any(ct in content_type for ct in NON_HTML_CONTENT_TYPES)
    except requests.RequestException as e:
        log.debug(f"HEAD request failed for {url}, continuing anyway: {e}")
        return False


def _looks_like_binary(text: str) -> bool:
    if not text:
        return False
    sample = text[:1000]
    if sample.lstrip().startswith("%PDF"):
        return True
    non_printable = sum(1 for c in sample if ord(c) < 32 and c not in "\n\r\t")
    return (non_printable / max(len(sample), 1)) > 0.05


class ArticleScraper(BaseScraper):
    def scrape(self, url: str) -> Result[ScrapedArticle]:
        log.debug(f"scraping {url}")
        try:
            if _is_non_html_content(url):
                log.warning(f"non-HTML content detected (PDF/binary), skipping {url}")
                return Result.fail(f"non-HTML content (PDF/binary): {url}")

            full_text = None

            if _parsing_url(url):
                log.debug(f"using newspaper4k for {url}")
                full_text = self._scrape_newspaper(url)
            else:
                log.debug(f"using trafilatura for {url}")
                full_text = self._scrape_trafilatura(url)

                if not full_text:
                    log.debug(
                        f"trafilatura failed, falling back to newspaper4k for {url}"
                    )
                    full_text = self._scrape_newspaper(url)

            if not full_text:
                log.warning(f"no content extracted from {url}")
                return Result.fail(f"no content extracted from {url}")

            if _looks_like_binary(full_text):
                log.warning(f"binary/garbage content extracted from {url}, skipping")
                return Result.fail(f"binary content extracted: {url}")

            log.debug(f"scraped {len(full_text)} chars from {url}")
            return Result.ok(ScrapedArticle(url=url, full_text=full_text))

        except Exception as e:
            log.error(f"scrape error {url}: {e}")
            return Result.fail(f"scrape error {url}: {e}")

    def _scrape_trafilatura(self, url: str) -> str | None:
        try:
            html = trafilatura.fetch_url(url)
            if not html:
                return None
            return trafilatura.extract(html, favor_recall=True)
        except Exception as e:
            log.warning(f"trafilatura error on {url}: {e}")
            return None

    def _scrape_newspaper(self, url: str) -> str | None:
        try:
            from newspaper import Article

            a = Article(url)
            a.download()
            a.parse()
            return a.text if a.text and a.text.strip() else None
        except Exception as e:
            log.warning(f"newspaper4k error on {url}: {e}")
            return None
