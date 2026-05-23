from pydantic import BaseModel
from typing import List


class VideoRow(BaseModel):
    id: str
    external_id: str
    title: str
    scrape_skipped: bool = False


class VideoEmbeddingRow(BaseModel):
    video_id: str
    vector: List[float]
    main_topic: str
    keywords: List[str]


__all__ = ["VideoRow", "VideoEmbeddingRow"]
