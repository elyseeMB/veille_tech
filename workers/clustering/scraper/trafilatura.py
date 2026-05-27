import trafilatura
from urllib.parse import urlparse
from scraper.base import BaseScraper, ScrapedArticle
from shared import Result
from logger import get_logger
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="newspaper")
log = get_logger("scrapper.article")

NEWSPAPER_DOMAINS = ["arstechnica.com"]


def _parsing_url(url: str) -> bool:
    domain = urlparse(url).netloc
    return any(d in domain for d in NEWSPAPER_DOMAINS)


class ArticleScraper(BaseScraper):
    def scrape(self, url: str) -> Result[ScrapedArticle]:
        log.debug(f"scraping {url}")
        try:
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
