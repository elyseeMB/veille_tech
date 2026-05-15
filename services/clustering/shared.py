from pydantic import BaseModel
from typing import TypeVar, Generic, Optional, List

T = TypeVar("T")

class Result(BaseModel, Generic[T]):
    value:   Optional[T] = None
    error:   Optional[str] = None
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

class NamingResult(BaseModel):
    label: str

__all__ = ["Result", "EmbeddingResult", "ClusterResult", "NamingResult"]
