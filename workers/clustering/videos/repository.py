from abc import ABC, abstractmethod
from typing import List
from shared import Result
from videos.model import VideoRow, VideoEmbeddingRow
from logger import get_logger

log = get_logger("repository.videos")


class BaseVideoRepository(ABC):
    @abstractmethod
    def get_videos_without_cluster(self) -> Result[List[VideoRow]]:
        pass

    @abstractmethod
    def mark_as_skipped(self, video_id: str) -> Result[None]:
        pass

    @abstractmethod
    def save_embedding(self, row: VideoEmbeddingRow) -> Result[None]:
        pass


class MockVideoRepository(BaseVideoRepository):
    def get_videos_without_cluster(self) -> Result[List[VideoRow]]:
        return Result.ok(
            [
                VideoRow(
                    id="1", external_id="3DYk0aakoSw", title="Micode - La Défense"
                ),
                VideoRow(
                    id="2", external_id="dQw4w9WgXcQ", title="Fireship - React in 100s"
                ),
                VideoRow(
                    id="3",
                    external_id="QLu_ZsRc_G0",
                    title="Underscore - DevOps en 2025",
                ),
                VideoRow(
                    id="4",
                    external_id="Y7ImxZ_YhJk",
                    title="Computerphile - How LLMs Work",
                ),
                VideoRow(
                    id="5", external_id="4h5BEALuh44", title="Theo - Why I left React"
                ),
                VideoRow(
                    id="6",
                    external_id="ldxFjLJ3rVY",
                    title="3Blue1Brown - Neural Networks",
                ),
            ]
        )

    def mark_as_skipped(self, video_id: str) -> Result[None]:
        log.warning(f"mock mark skipped video: {video_id}")
        return Result.ok(None)

    def save_embedding(self, row: VideoEmbeddingRow) -> Result[None]:
        log.debug(
            f"mock save embedding: video={row.video_id} vector_size={len(row.vector)}"
        )
        return Result.ok(None)


class PostgresVideoRepository(BaseVideoRepository):
    __conn: any

    def __init__(self, conn):
        self.__conn = conn

    def get_videos_without_cluster(self) -> Result[List[VideoRow]]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute("""SELECT v.id, v.external_id, v.title, v.embedding
                        FROM videos v
                        LEFT JOIN cluster_items ci ON ci.ref_id = v.id AND ci.type = 'video'::feed_item_type
                        WHERE ci.ref_id IS NULL
                        AND v.scrape_skipped = FALSE;""")
                    rows = cur.fetchall()
                    return Result.ok(
                        [
                            VideoRow(
                                id=str(row[0]),
                                external_id=row[1],
                                title=row[2],
                                embedding=row[3],
                            )
                            for row in rows
                        ]
                    )
            finally:
                self.__conn.put(conn)
        except Exception as e:
            return Result.fail(f"db fetch videos error: {e}")

    def mark_as_skipped(self, video_id: str) -> Result[None]:
        log.warning(f"marking video as skipped — {video_id}")
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE videos SET scrape_skipped = TRUE WHERE id = %s
                    """,
                        (video_id,),
                    )
                conn.commit()
            finally:
                self.__conn.put(conn)
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"mark skipped video error: {e}")

    def save_embedding(self, row: VideoEmbeddingRow) -> Result[None]:
        log.debug(
            f"writing embedding and metadata — video={row.video_id} vector_size={len(row.vector)}"
        )
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE videos 
                        SET 
                            embedding = %s::vector,
                            category = %s,
                            keywords = %s
                        WHERE id = %s
                        """,
                        (
                            str(row.vector),
                            row.main_topic,
                            row.keywords,
                            row.video_id,
                        ),
                    )
                conn.commit()
            finally:
                self.__conn.put(conn)

            log.debug(f"embedding and metadata saved — video={row.video_id}")
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"save video embedding error: {e}")
