import numpy as np
import umap
import hdbscan
from shared import Result, EmbeddingResult, ClusterResult


class Clusterer:
    __umap: any

    def __init__(self):
        self.__umap = umap.UMAP(n_components=2, random_state=42)

    def cluster(self, embeddings: EmbeddingResult) -> Result[ClusterResult]:
        try:
            n = len(embeddings.vectors)
            min_size = max(5, min(10, n // 8))
            clusterer = hdbscan.HDBSCAN(min_cluster_size=min_size, min_samples=5)
            vectors = np.array(embeddings.vectors)
            reduced = self.__umap.fit_transform(vectors)
            labels = clusterer.fit_predict(reduced)
            return Result.ok(ClusterResult(labels=labels.tolist()))
        except Exception as e:
            return Result.fail(f"clustering error: {e}")
