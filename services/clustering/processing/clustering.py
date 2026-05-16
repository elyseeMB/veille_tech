import numpy as np

from shared import Result, EmbeddingResult, ClusterResult


class Clusterer:
    __umap: any
    __clusterer: any

    def __init__(self):
        self.__umap = None
        self.__clusterer = None

    def __load_models(self):
        import umap
        import hdbscan

        if self.__umap is None:
            self.__umap = umap.UMAP(n_neighbors=5, n_components=2, random_state=42)

        if self.__clusterer is None:
            self.__clusterer = hdbscan.HDBSCAN(
                min_cluster_size=3, min_samples=2, metric="euclidean"
            )

    def cluster(self, embeddings: EmbeddingResult) -> Result[ClusterResult]:
        try:
            self.__load_models()

            vectors = np.array(embeddings.vectors)
            reduced = self.__umap.fit_transform(vectors)
            labels = self.__clusterer.fit_predict(reduced)

            return Result.ok(ClusterResult(labels=labels.tolist()))

        except Exception as e:
            return Result.fail(f"clustering error: {e}")
