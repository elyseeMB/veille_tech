from abc import ABC, abstractmethod
from typing import List
import uuid
from shared import Result
from articles.model import ArticleRow, ClusterRow, EmbeddingRow
from logger import get_logger

log = get_logger("repository.articles")


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
                    url="https://www.blogdumoderateur.com/mistral-3/",
                ),
                ArticleRow(
                    id="3",
                    title="Rust est intégré au noyau Linux",
                    url="https://www.programmez.com/actualites/linux-rust-38696",
                ),
                ArticleRow(
                    id="4",
                    title="Meta annonce Llama 4",
                    url="https://www.leptidigital.fr/meta-llama-4-75542/",
                ),
                ArticleRow(
                    id="5",
                    title="Google dévoile Gemini Ultra 2",
                    url="https://blog.google/technology/ai/gemini-ultra-2/",
                ),
                ArticleRow(
                    id="6",
                    title="Apple intègre l'IA dans iOS 19",
                    url="https://www.macrumors.com/2025/ios-19-ai/",
                ),
                ArticleRow(
                    id="7",
                    title="Nvidia annonce le GPU H200",
                    url="https://nvidianews.nvidia.com/news/h200",
                ),
                ArticleRow(
                    id="8",
                    title="Linux 6.8 sort avec le support Rust",
                    url="https://kernelnewbies.org/Linux_6.8",
                ),
                ArticleRow(
                    id="9",
                    title="TypeScript 5.5 améliore les perfs",
                    url="https://devblogs.microsoft.com/typescript/typescript-5-5/",
                ),
                ArticleRow(
                    id="10",
                    title="AWS Lambda supporte Python 3.13",
                    url="https://aws.amazon.com/blogs/compute/python-313-lambda/",
                ),
            ]
        )

    def mark_as_skipped(self, article_id: str) -> Result[None]:
        log.warning(f"mock mark skipped: {article_id}")
        return Result.ok(None)

    def save_embedding(self, row: EmbeddingRow) -> Result[None]:
        log.debug(
            f"mock save embedding: article={row.article_id} vector_size={len(row.vector)}"
        )
        return Result.ok(None)

    def save_clusters(self, clusters: List[ClusterRow]) -> Result[None]:
        log.info(
            f"mock save clusters: {[(c.label, len(c.article_ids), len(c.video_ids)) for c in clusters]}"
        )
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
                    cur.execute("""SELECT a.id, a.title, a.url
                        FROM articles a
                        LEFT JOIN cluster_items ci ON ci.ref_id = a.id AND ci.type = 'article'::feed_item_type
                        WHERE ci.ref_id IS NULL
                        AND a.scrape_skipped = FALSE
                        AND a.published_at >= NOW() - INTERVAL '48 hours'""")
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
        log.warning(f"marking article as skipped — {article_id}")
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE articles SET scrape_skipped = TRUE WHERE id = %s
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
        log.debug(
            f"writing embedding — article={row.article_id} vector_size={len(row.vector)}"
        )
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE articles SET embedding = %s::vector WHERE id = %s
                    """,
                        (str(row.vector), row.article_id),
                    )
                conn.commit()
            finally:
                self.__conn.put(conn)
            log.debug(f"embedding saved — article={row.article_id}")
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"save embedding error: {e}")

    def save_clusters(self, clusters: List[ClusterRow]) -> Result[None]:
        log.info(f"writing {len(clusters)} clusters to DB")
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
                                INSERT INTO cluster_items (cluster_id, type, ref_id)
                                VALUES (%s, 'article', %s)
                            """,
                                (cluster_id, article_id),
                            )

                        for video_id in cluster.video_ids:
                            cur.execute(
                                """
                                INSERT INTO cluster_items (cluster_id, type, ref_id)
                                VALUES (%s, 'video', %s)
                            """,
                                (cluster_id, video_id),
                            )

                conn.commit()
            finally:
                self.__conn.put(conn)
            log.info(f"{len(clusters)} clusters saved")
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"db save error: {e}")
