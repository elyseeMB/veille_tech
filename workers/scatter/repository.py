from typing import List, Optional
from shared import Result
from logger import get_logger

log = get_logger("repository")


class ScatterRepository:
    __conn: any

    def __init__(self, conn):
        self.__conn = conn

    def get_recent_clusters(self, days: int = 60) -> Result[List[dict]]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """SELECT c.id, c.label, c.description, c.created_at,
                                  COUNT(ci.id)::int AS volume
                           FROM clusters c
                           LEFT JOIN cluster_items ci ON ci.cluster_id = c.id
                           WHERE c.created_at >= NOW() - INTERVAL '%s days'
                           GROUP BY c.id
                           ORDER BY c.created_at""",
                        (days,),
                    )
                    rows = cur.fetchall()
                    return Result.ok(
                        [
                            {
                                "id": str(row[0]),
                                "label": row[1],
                                "description": row[2],
                                "created_at": row[3].isoformat(),
                                "volume": row[4],
                            }
                            for row in rows
                        ]
                    )
            finally:
                self.__conn.put(conn)
        except Exception as e:
            return Result.fail(f"db fetch clusters error: {e}")

    def get_cluster_embeddings(self, cluster_id: str) -> Result[List[list]]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """SELECT a.embedding FROM articles a
                           JOIN cluster_items ci ON ci.ref_id = a.id AND ci.type = 'article'
                           WHERE ci.cluster_id = %s AND a.embedding IS NOT NULL
                           UNION ALL
                           SELECT v.embedding FROM videos v
                           JOIN cluster_items ci ON ci.ref_id = v.id AND ci.type = 'video'
                           WHERE ci.cluster_id = %s AND v.embedding IS NOT NULL""",
                        (cluster_id, cluster_id),
                    )
                    rows = cur.fetchall()
                    embeddings = [list(row[0]) for row in rows if row[0] is not None]
                    return Result.ok(embeddings)
            finally:
                self.__conn.put(conn)
        except Exception as e:
            return Result.fail(f"db fetch embeddings error: {e}")

    def get_current_month_articles(self) -> Result[List[dict]]:
        try:
            conn = self.__conn.get()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """SELECT a.id, a.title, a.published_at, a.url, a.embedding,
                                  c.id as cluster_id, c.label as cluster_name, 'article'
                           FROM articles a
                           JOIN cluster_items ci ON ci.ref_id = a.id AND ci.type = 'article'
                           JOIN clusters c ON ci.cluster_id = c.id
                           WHERE a.published_at >= DATE_TRUNC('month', NOW())
                             AND a.embedding IS NOT NULL
                           UNION ALL
                           SELECT v.id, v.title, v.published_at, v.external_id, v.embedding,
                                  c.id, c.label, 'video'
                           FROM videos v
                           JOIN cluster_items ci ON ci.ref_id = v.id AND ci.type = 'video'
                           JOIN clusters c ON ci.cluster_id = c.id
                           WHERE v.published_at >= DATE_TRUNC('month', NOW())
                             AND v.embedding IS NOT NULL
                           ORDER BY published_at
                           LIMIT 500"""
                    )
                    rows = cur.fetchall()
                    return Result.ok(
                        [
                            {
                                "id": str(row[0]),
                                "title": row[1],
                                "published_at": row[2].isoformat(),
                                "link": (
                                    row[3]
                                    if row[7] == "article"
                                    else f"https://youtube.com/watch?v={row[3]}"
                                ),
                                "embedding": list(row[4]),
                                "cluster_id": str(row[5]),
                                "cluster_name": row[6],
                            }
                            for row in rows
                        ]
                    )
            finally:
                self.__conn.put(conn)
        except Exception as e:
            return Result.fail(f"db fetch current month articles error: {e}")


class MockScatterRepository:
    def get_recent_clusters(self, days: int = 60) -> Result[List[dict]]:
        return Result.ok(
            [
                {
                    "id": "cl1",
                    "label": "Kubernetes",
                    "description": "Container orchestration",
                    "created_at": "2026-05-03T10:00:00Z",
                    "volume": 12,
                },
                {
                    "id": "cl2",
                    "label": "AWS Lambda",
                    "description": "Serverless computing",
                    "created_at": "2026-05-08T12:00:00Z",
                    "volume": 8,
                },
                {
                    "id": "cl3",
                    "label": "OpenAI GPT",
                    "description": "LLM releases",
                    "created_at": "2026-05-19T14:00:00Z",
                    "volume": 24,
                },
                {
                    "id": "cl4",
                    "label": "Kubernetes",
                    "description": "K8s ecosystem",
                    "created_at": "2026-05-21T09:00:00Z",
                    "volume": 18,
                },
                {
                    "id": "cl5",
                    "label": "Rust",
                    "description": "Systems programming",
                    "created_at": "2026-05-22T11:00:00Z",
                    "volume": 6,
                },
            ]
        )

    def get_cluster_embeddings(self, cluster_id: str) -> Result[List[list]]:
        import random

        dim = 1024
        count = random.randint(3, 10)
        return Result.ok(
            [[random.uniform(-1, 1) for _ in range(dim)] for _ in range(count)]
        )

    def get_current_month_articles(self) -> Result[List[dict]]:
        import random
        import datetime

        dim = 1024
        articles = []
        clusters = [
            ("cl1", "Kubernetes"),
            ("cl2", "AWS Lambda"),
            ("cl3", "OpenAI GPT"),
            ("cl4", "Rust"),
        ]
        now = datetime.datetime.now(datetime.timezone.utc)
        for i in range(30):
            cluster = random.choice(clusters)
            day = random.randint(1, 28)
            articles.append(
                {
                    "id": f"art{i}",
                    "title": f"Article about {cluster[1]} #{i}",
                    "published_at": now.replace(
                        day=day, hour=random.randint(0, 23)
                    ).isoformat(),
                    "link": f"https://example.com/article/{i}",
                    "embedding": [random.uniform(-1, 1) for _ in range(dim)],
                    "cluster_id": cluster[0],
                    "cluster_name": cluster[1],
                }
            )
        return Result.ok(articles)
