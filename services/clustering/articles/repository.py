from abc import ABC, abstractmethod
from typing import List
import uuid
from shared import Result
from articles.model import ArticleRow, ClusterRow, EmbeddingRow


class BaseRepository(ABC):
    @abstractmethod
    def get_articles_without_cluster(self) -> Result[List[ArticleRow]]:
        pass

    @abstractmethod
    def mark_as_skipped(self, article_id: str) -> Result[None]:
        pass

    @abstractmethod
    def save_embedding(self, row: EmbeddingRow) -> Result[None]:
        pass

    @abstractmethod
    def save_clusters(self, clusters: List[ClusterRow]) -> Result[None]:
        pass


class MockRepository(BaseRepository):
    def get_articles_without_cluster(self) -> Result[List[ArticleRow]]:
        return Result.ok(
            [
                ArticleRow(
                    id="1",
                    title="OpenAI lance GPT-5",
                    url="https://openai.com/fr-FR/index/introducing-gpt-5/",
                ),
                ArticleRow(
                    id="2",
                    title="Mistral AI lance Mistral 3",
                    url="https://www.blogdumoderateur.com/mistral-3-nouvelle-generation-modeles-open-source/",
                ),
                ArticleRow(
                    id="3",
                    title="Rust est intégré au noyau Linux",
                    url="https://www.programmez.com/actualites/linux-rust-est-dans-le-noyau-et-pour-y-rester-38696",
                ),
                ArticleRow(
                    id="4",
                    title="Meta annonce Llama 4",
                    url="https://www.leptidigital.fr/intelligence-artificielle-ia/meta-llama-4-modeles-ia-multimodaux-ultra-puissants-75542/",
                ),
            ]
        )

    def mark_as_skipped(self, article_id: str) -> Result[None]:
        print(f"mock mark skipped: {article_id}")
        return Result.ok(None)

    def save_embedding(self, row: EmbeddingRow) -> Result[None]:
        print(
            f"mock save embedding: article={row.article_id} vector_size={len(row.vector)}"
        )
        return Result.ok(None)

    def save_clusters(self, clusters: List[ClusterRow]) -> Result[None]:
        print(f"mock save clusters: {clusters}")
        return Result.ok(None)


class PostgresRepository(BaseRepository):
    __conn: any

    def __init__(self, conn):
        self.__conn = conn

    def get_articles_without_cluster(self) -> Result[List[ArticleRow]]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT a.id, a.title, a.url
                        FROM articles a
                        LEFT JOIN article_clusters ac ON ac.article_id = a.id
                        WHERE ac.article_id IS NULL
                        AND a.scrape_skipped = FALSE
                        AND a.published_at >= NOW() - INTERVAL '24 hours'
                    """)
                    rows = cur.fetchall()
                    return Result.ok(
                        [
                            ArticleRow(id=str(row[0]), title=row[1], url=row[2])
                            for row in rows
                        ]
                    )
            finally:
                self.__conn.put(conn)
        except Exception as e:
            return Result.fail(f"db fetch error: {e}")

    def mark_as_skipped(self, article_id: str) -> Result[None]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE articles
                        SET scrape_skipped = TRUE
                        WHERE id = %s
                    """,
                        (article_id,),
                    )
                conn.commit()
            finally:
                self.__conn.put(conn)
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"mark skipped error: {e}")

    def save_embedding(self, row: EmbeddingRow) -> Result[None]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE articles
                        SET embedding = %s::vector
                        WHERE id = %s
                    """,
                        (str(row.vector), row.article_id),
                    )
                conn.commit()
            finally:
                self.__conn.put(conn)
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"save embedding error: {e}")

    def save_clusters(self, clusters: List[ClusterRow]) -> Result[None]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    for cluster in clusters:
                        cluster_id = str(uuid.uuid4())
                        cur.execute(
                            """
                            INSERT INTO clusters (id, label, description)
                            VALUES (%s, %s, %s)
                        """,
                            (cluster_id, cluster.label, cluster.description),
                        )

                        for article_id in cluster.article_ids:
                            cur.execute(
                                """
                                INSERT INTO article_clusters (article_id, cluster_id)
                                VALUES (%s, %s)
                            """,
                                (article_id, cluster_id),
                            )
                conn.commit()
            finally:
                self.__conn.put(conn)
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"db save error: {e}")