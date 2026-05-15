import trafilatura
from scraper.base import BaseScraper, ScrapedArticle
from shared       import Result

class TrafilaturaScraper(BaseScraper):
    def scrape(self, url: str) -> Result[ScrapedArticle]:
        try:
            html      = trafilatura.fetch_url(url)
            full_text = trafilatura.extract(html)

            if not full_text:
                return Result.fail(f"no content extracted from {url}")

            return Result.ok(ScrapedArticle(
                url       = url,
                full_text = full_text
            ))
        except Exception as e:
            return Result.fail(f"scrape error {url}: {e}")
