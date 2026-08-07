from dotenv import load_dotenv

load_dotenv()

import os

import boto3

from container import Container
from logger import get_logger
from pipeline.cluster_naming import build_clusters, group_by_label
from pipeline.database import save_embeddings
from pipeline.embeddings import embed_items
from pipeline.metadata import extract_missing_metadata
from pipeline.scraping import scrape_and_chunk
from shared import EmbeddingResult

log = get_logger("app")
container = None


def load_secrets():
    if os.getenv("AWS_LAMBDA_RUNTIME_API") is None:
        return
    ssm = boto3.client("ssm")
    params = {
        "DATABASE_URL": os.environ.get("DB_PARAM_NAME"),
        "CF_ACCOUNT_ID": os.environ.get("CF_ACCOUNT_ID"),
        "CF_API_TOKEN": os.environ.get("CF_API_TOKEN"),
        "CF_API_TOKEN_GATEWAY": os.environ.get("CF_API_TOKEN_GATEWAY"),
        "GEMINI_API_KEY": os.environ.get("GEMINI_API_KEY"),
    }
    for env_key, ssm_path in params.items():
        if ssm_path and (ssm_path.startswith("/") or ssm_path.startswith("veille")):
            try:
                resp = ssm.get_parameter(Name=ssm_path, WithDecryption=True)
                os.environ[env_key] = resp["Parameter"]["Value"]
            except Exception as e:
                log.error(f"failed to load ssm parameter {ssm_path}: {e}")


def handler(event, context):
    global container
    try:
        if container is None:
            load_secrets()
            container = Container()

        # ── 1. Fetch ──────────────────────────────────────────────────────
        log.info("fetching articles and videos...")
        articles = container.repository.get_articles_without_cluster()
        videos = container.video_repository.get_videos_without_cluster()

        if not articles.success:
            log.error(f"articles fetch error: {articles.error}")
        if not videos.success:
            log.error(f"videos fetch error: {videos.error}")

        log.info(
            f"found {len(articles.value or [])} articles, {len(videos.value or [])} videos"
        )

        # ── 2. Scrape + chunk ─────────────────────────────────────────────
        log.info("scraping articles...")
        scraped_articles = scrape_and_chunk(
            items=articles.value or [],
            scrape_fn=container.article_scraper.scrape,
            id_field="id",
            url_field="url",
            skip_fn=container.repository.mark_as_skipped,
            chunker=container.chunker,
            embedder=container.embedder,
            item_type="article",
        )
        extract_missing_metadata(scraped_articles, container.metadata_extractor.extract)
        log.info(
            f"scraped {len(scraped_articles)}/{len(articles.value or [])} articles"
        )

        if container.youtube_scraper is None:
            log.warning("youtube scraping disabled")
            scraped_videos = []
        else:
            log.info("scraping videos...")
            scraped_videos = scrape_and_chunk(
                items=videos.value or [],
                scrape_fn=container.youtube_scraper.scrape,
                id_field="id",
                url_field="external_id",
                skip_fn=container.video_repository.mark_as_skipped,
                chunker=container.chunker,
                embedder=container.embedder,
                item_type="video",
            )
            extract_missing_metadata(
                scraped_videos, container.metadata_extractor.extract
            )
            log.info(f"scraped {len(scraped_videos)}/{len(videos.value or [])} videos")

        all_items = scraped_articles + scraped_videos

        if not all_items:
            log.warning("no content scraped")
            return

        # ── 3. Embed ──────────────────────────────────────────────────────
        total_chunks = sum(len(i["chunks"]) for i in all_items)
        log.info(f"embedding {len(all_items)} items — {total_chunks} chunks total")

        all_items, error = embed_items(all_items, container.embedder)
        if error:
            log.error(error)
            return

        log.info("embeddings done")

        # ── 4. Save embeddings ────────────────────────────────────────────
        save_embeddings(all_items, container.repository, container.video_repository)

        # ── 5. Clustering ─────────────────────────────────────────────────
        if len(all_items) < 5:
            log.warning(f"not enough content ({len(all_items)}) to cluster")
            return

        log.info(f"clustering {len(all_items)} items...")
        clusters = container.clusterer.cluster(
            EmbeddingResult(vectors=[i["vector"] for i in all_items])
        )
        if not clusters.success:
            log.error(clusters.error)
            return

        # ── 6. Group by cluster ───────────────────────────────────────────
        groups, _ = group_by_label(all_items, clusters.value.labels)

        if not groups:
            log.warning("no clusters formed")
            return

        # ── 7. Name + save ────────────────────────────────────────────────
        cluster_rows = build_clusters(
            groups, clusters.value.cohesion_scores, container.namer
        )

        log.info(f"saving {len(cluster_rows)} clusters...")
        saved = container.repository.save_clusters(cluster_rows)
        if not saved.success:
            log.error(saved.error)
            return

        log.info(
            f"done — {len(cluster_rows)} clusters saved ({len(scraped_articles)} articles + {len(scraped_videos)} videos)"
        )

    except Exception as e:
        log.error(f"handler error: {e}")


if __name__ == "__main__":
    handler(None, None)
