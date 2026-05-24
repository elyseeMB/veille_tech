from pydantic import BaseModel
from typing import List, Optional


class ArticleRow(BaseModel):
    id: str
    title: str
    url: str
    description: Optional[str] = None
    scrape_skipped: bool = False
    keywords: List[str] = []
    embedding: Optional[List[float]] = None


class ClusterRow(BaseModel):
    label: str
    description: Optional[str] = None
    article_ids: List[str] = []
    video_ids: List[str] = []


class EmbeddingRow(BaseModel):
    article_id: str
    vector: List[float]
    main_topic: str
    keywords: List[str]


__all__ = ["ArticleRow", "ClusterRow", "EmbeddingRow"]
