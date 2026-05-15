from abc import ABC, abstractmethod
from pydantic import BaseModel
from shared import Result

class ScrapedArticle(BaseModel):
    url:       str
    full_text: str

class BaseScraper(ABC):
    @abstractmethod
    def scrape(self, url: str) -> Result[ScrapedArticle]:
        pass

__all__ = ["BaseScraper", "ScrapedArticle"]
