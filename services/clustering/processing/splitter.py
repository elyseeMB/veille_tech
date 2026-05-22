from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from processing import EmbeddingInput


class TextChunker:
    def __init__(self):
        self.__splitter = RecursiveCharacterTextSplitter(
            chunk_size=800, chunk_overlap=50
        )

    def chunk(self, text: str) -> List[str]:
        return self.__splitter.split_text(text)

    def average_vectors(self, vectors: List[List[float]]) -> List[float]:
        return np.mean(vectors, axis=0).tolist()

    def select_best_chunks(
        self, title: str, chunks: List[str], embedder, top_k: int = 3
    ) -> List[str]:
        if len(chunks) <= top_k:
            return chunks

        all_texts = [title] + chunks
        result = embedder.embed(EmbeddingInput(texts=all_texts))
        if not result.success:
            return chunks[:top_k]

        vectors = np.array(result.value.vectors)
        ref_vector = vectors[0:1]
        chunk_vectors = vectors[1:]

        scores = cosine_similarity(ref_vector, chunk_vectors)[0]

        top_indices = sorted(np.argsort(scores)[-top_k:].tolist())

        return [chunks[i] for i in top_indices]
