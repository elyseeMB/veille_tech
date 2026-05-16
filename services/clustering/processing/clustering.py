import numpy as np

from shared import Result, EmbeddingResult, ClusterResult


class Clusterer:
    __umap: any
    __clusterer: any

    def __init__(self):
        self.__umap = None
        self.__clusterer = None

    def __load_models(self, n_articles: int):
        import umap
        import hdbscan

        n_neighbors = min(15, max(5, n_articles // 10))
        if n_neighbors >= n_articles:
            n_neighbors = max(2, n_articles - 1)

        min_cluster_size = max(2, n_articles // 20)
        if min_cluster_size >= n_articles:
            min_cluster_size = 2

        self.__umap = umap.UMAP(
            n_neighbors=n_neighbors, n_components=5, random_state=42
        )

        self.__clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size, min_samples=1, metric="euclidean"
        )

    def cluster(self, embeddings: EmbeddingResult) -> Result[ClusterResult]:
        try:
            n_articles = len(embeddings.vectors)

            if n_articles < 3:
                print(f"not enough articles to cluster ({n_articles}), skipping")
                return Result.ok(ClusterResult(labels=[0] * n_articles))

            if n_articles > 300:
                print(f"warning: large dataset ({n_articles} articles), may be slow")

            self.__load_models(n_articles)

            print(
                f"clustering {n_articles} articles | n_neighbors={self.__umap.n_neighbors} | min_cluster_size={self.__clusterer.min_cluster_size}"
            )

            vectors = np.array(embeddings.vectors)
            reduced = self.__umap.fit_transform(vectors)
            labels = self.__clusterer.fit_predict(reduced)

            n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
            n_noise = list(labels).count(-1)
            print(f"result: {n_clusters} clusters, {n_noise} noise articles")

            return Result.ok(ClusterResult(labels=labels.tolist()))

        except Exception as e:
            return Result.fail(f"clustering error: {e}")
