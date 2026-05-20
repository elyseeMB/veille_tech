import trafilatura
from scraper.base import BaseScraper, ScrapedArticle
from shared import Result
from logger import get_logger

log = get_logger("scrapper.article")


class TrafilaturaScraper(BaseScraper):
    def scrape(self, url: str) -> Result[ScrapedArticle]:
        log.debug(f"scraping {url}")
        try:
            html = trafilatura.fetch_url(url)
            full_text = trafilatura.extract(html)

            if not full_text:
                log.warning(f"no content extracted from {url}")
                return Result.fail(f"no content extracted from {url}")

            log.debug(f"scraped {len(full_text)} chars from {url}")
            return Result.ok(ScrapedArticle(url=url, full_text=full_text))
        except Exception as e:

            log.error(f"scrape error {url}: {e}")
            return Result.fail(f"scrape error {url}: {e}")
