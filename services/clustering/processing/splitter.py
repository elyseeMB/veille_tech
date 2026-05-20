from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
import numpy as np


class TextChunker:
    def __init__(self):
        self.__splitter = RecursiveCharacterTextSplitter(
            chunk_size=400, chunk_overlap=50
        )

    def chunk(self, text: str) -> List[str]:
        return self.__splitter.split_text(text)

    def average_vectors(self, vectors: List[List[float]]) -> List[float]:
        return np.mean(vectors, axis=0).tolist()
