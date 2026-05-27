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
                    title="Node.js 26.2.0 : bug fix et quelques nouveautés",
                    url="https://www.programmez.com/actualites/nodejs-2620-bug-fix-et-quelques-nouveautes-39475",
                ),
                ArticleRow(
                    id="4",
                    title="Search agentique, Gemini 3.5 Flash, Spark : ce que Google I/O 2026 change pour les pros du digital",
                    url="https://www.leptidigital.fr/intelligence-artificielle-ia/recap-google-io-2026-pros-90178/",
                ),
                ArticleRow(
                    id="5",
                    title="I/O 2026: Welcome to the agentic Gemini era",
                    url="https://blog.google/innovation-and-ai/sundar-pichai-io-2026/",
                ),
                ArticleRow(
                    id="6",
                    title="NVIDIA Announces Financial Results for First Quarter Fiscal 2027",
                    url="https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2027",
                ),
                ArticleRow(
                    id="7",
                    title="Linux 6.8 sort avec le support Rust",
                    url="https://kernelnewbies.org/Linux_6.8",
                ),
                ArticleRow(
                    id="8",
                    title="Announcing TypeScript 7.0 Beta",
                    url="https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/",
                ),
                ArticleRow(
                    id="9",
                    title="Enhancing network observability with new AWS Outposts racks LAG metrics",
                    url="https://aws.amazon.com/fr/blogs/compute/enhancing-network-observability-with-new-aws-outposts-racks-lag-metrics/",
                ),
                ArticleRow(
                    id="10",
                    title="Uh-oh, the International Space Station is leaking again",
                    url="https://arstechnica.com/space/2026/05/uh-oh-the-international-space-station-is-leaking-again/",
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
                    cur.execute("""SELECT a.id, a.title, a.url, a.keywords, a.embedding
                    FROM articles a
                    LEFT JOIN cluster_items ci ON ci.ref_id = a.id AND ci.type = 'article'::feed_item_type
                    WHERE ci.ref_id IS NULL
                    AND a.scrape_skipped = FALSE
                    AND a.published_at >= NOW() - INTERVAL '48 hours' LIMIT 15""")
                    rows = cur.fetchall()
                    return Result.ok(
                        [
                            ArticleRow(
                                id=str(row[0]),
                                title=row[1],
                                url=row[2],
                                keywords=row[3] or [],
                                embedding=(
                                    list(row[4]) if row[4] is not None else None
                                ),
                            )
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
            f"writing embedding and metadata — article={row.article_id} vector_size={len(row.vector)}"
        )
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """UPDATE articles 
                            SET 
                                embedding = %s::vector,
                                category = CASE WHEN %s != '' THEN %s ELSE category END,
                                keywords = CASE WHEN array_length(%s::text[], 1) > 0 THEN %s ELSE keywords END
                            WHERE id = %s""",
                        (
                            str(row.vector),
                            row.main_topic,
                            row.main_topic,
                            row.keywords,
                            row.keywords,
                            row.article_id,
                        ),
                    )
                conn.commit()
            finally:
                self.__conn.put(conn)

            log.debug(f"embedding and metadata saved — article={row.article_id}")
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"save embedding and metadata error: {e}")

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
