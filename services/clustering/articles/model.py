from pydantic import BaseModel
from typing import List

class ArticleRow(BaseModel):
    id:             str
    title:          str
    url:            str
    scrape_skipped: bool = False

class ClusterRow(BaseModel):
    label:       str
    article_ids: List[str]

class EmbeddingRow(BaseModel):
    article_id: str
    vector:     List[float]

__all__ = ["ArticleRow", "ClusterRow", "EmbeddingRow"]
