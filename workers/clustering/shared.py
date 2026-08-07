from pydantic import BaseModel
from typing import TypeVar, Generic, Optional, List, TypedDict

T = TypeVar("T")


class ScrapedItem(TypedDict, total=False):
    id: str
    title: str
    full_text: str
    excerpt: str
    chunks: List[str]
    main_topic: str
    keywords: List[str]
    type: str
    existing_embedding: Optional[List[float]]
    vector: List[float]


class Result(BaseModel, Generic[T]):
    value: Optional[T] = None
    error: Optional[str] = None
    success: bool

    @staticmethod
    def ok(value: "T") -> "Result[T]":
        return Result(value=value, error=None, success=True)

    @staticmethod
    def fail(error: str) -> "Result[T]":
        return Result(value=None, error=error, success=False)


class EmbeddingResult(BaseModel):
    vectors: List[List[float]]


class ClusterResult(BaseModel):
    labels: List[int]
    cohesion_scores: dict[int, float] = {}


class NamingResult(BaseModel):
    label: str
    description: Optional[str] = None
    outlier_titles: List[str] = []


class NamingResultGemini(NamingResult):
    index: int


class MetadataResult(BaseModel):
    main_topic: str
    keywords: List[str]


__all__ = [
    "ClusterResult",
    "EmbeddingResult",
    "MetadataResult",
    "NamingResult",
    "NamingResultGemini",
    "Result",
    "ScrapedItem",
]
