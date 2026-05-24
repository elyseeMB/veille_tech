from dotenv import load_dotenv

load_dotenv()

import os
import boto3
from collections import defaultdict
from container import Container
from processing import MetadataInput
from processing.namers.base import BatchNamingInput, ClusterInput
from articles import ClusterRow, EmbeddingRow
from videos import VideoEmbeddingRow
from shared import EmbeddingResult
from logger import get_logger
from concurrent.futures import ThreadPoolExecutor, as_completed

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


def scrape_and_chunk(
    items,
    scrape_fn,
    id_field,
    url_field,
    skip_fn,
    chunker,
    embedder,
    metadata_extractor_fn,
    item_type,
):
    def process_item(item):
        try:
            url_or_id = getattr(item, url_field)
            scraped = scrape_fn(url_or_id)
            if scraped.success and scraped.value and scraped.value.full_text:
                chunks = chunker.chunk(scraped.value.full_text)
                chunks = chunker.select_best_chunks(item.title, chunks, embedder)

                log.debug(f"--- BEST CHUNKS : {item.title} ---")
                for idx, c in enumerate(chunks):
                    log.debug(f"  Chunk {idx + 1}: {c[:2]}...")

                if not chunks:
                    skip_fn(getattr(item, id_field))
                    return None

                existing_category = getattr(item, "category", "") or getattr(
                    item, "main_topic", ""
                )

                if getattr(item, "keywords", None) and existing_category.strip() != "":
                    keywords = item.keywords
                    main_topic = existing_category
                    existing_embedding = getattr(item, "embedding", None)
                    log.debug(
                        f"keywords + category already exist for '{item.title}' — skipping extraction"
                    )
                else:
                    meta_result = metadata_extractor_fn(
                        MetadataInput(title=item.title, chunks=chunks)
                    )

                    if meta_result.success:
                        main_topic = meta_result.value.main_topic
                        keywords = meta_result.value.keywords
                    else:
                        log.warning(
                            f"metadata extraction failed for {item.title}: {meta_result.error}"
                        )
                        main_topic = existing_category
                        keywords = getattr(item, "keywords", []) or []

                    # Forcer régénération embedding — metadata a changé
                    existing_embedding = None

                return {
                    "id": getattr(item, id_field),
                    "title": item.title,
                    "full_text": scraped.value.full_text,
                    "excerpt": " ".join(chunks[:5]),
                    "chunks": chunks,
                    "main_topic": main_topic,
                    "keywords": keywords,
                    "type": item_type,
                    "existing_embedding": existing_embedding,
                }
            else:
                log.warning(f"scraping failed for {url_or_id}, skipping")
                skip_fn(getattr(item, id_field))
                return None
        except Exception as e:
            log.error(f"error scraping {getattr(item, url_field)}: {e}")
            skip_fn(getattr(item, id_field))
            return None

    result = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(process_item, item): item for item in items}
        for future in as_completed(futures):
            item_result = future.result()
            if item_result:
                result.append(item_result)
    return result


def embed_items(items, embedder):
    to_embed = []
    for item in items:
        if item.get("existing_embedding"):
            item["vector"] = item["existing_embedding"]
        else:
            to_embed.append(item)

    log.info(
        f"{len(items) - len(to_embed)} embeddings récupérés depuis DB, {len(to_embed)} à calculer"
    )

    if not to_embed:
        return items, None

    texts_to_embed = []
    for item in to_embed:
        tags_parts = []
        if item["main_topic"]:
            tags_parts.append(item["main_topic"])
        tags_parts.extend(item["keywords"])
        tags_str = ", ".join(tags_parts) if tags_parts else ""

        chunks_str = " ".join(item["chunks"])
        enriched_text = (
            f"Title: {item['title']} | Tags: {tags_str} | Content: {chunks_str}"
            if tags_str
            else f"Title: {item['title']} | Content: {chunks_str}"
        )
        texts_to_embed.append(enriched_text)
        log.info(f"enriched text for '{item['title']}': {enriched_text[:150]}...")

    embeddings = embedder.embed_in_batches(texts_to_embed, batch_size=50)
    if not embeddings.success:
        return None, embeddings.error

    for i, vector in enumerate(embeddings.value.vectors):
        to_embed[i]["vector"] = vector
        log.info(
            f"embedding generated for '{to_embed[i]['title']}' -> shape: {len(vector)}, preview: {vector[:5]}..."
        )

    return items, None


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
            metadata_extractor_fn=container.metadata_extractor.extract,
            item_type="article",
        )
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
                metadata_extractor_fn=container.metadata_extractor.extract,
                item_type="video",
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

        # ── 4. Sauvegarder les embeddings ─────────────────────────────────
        log.info(f"saving embeddings...")
        saved_count = 0
        for item in all_items:
            # Skip si embedding récupéré depuis DB — pas besoin de re-sauvegarder
            if item.get("existing_embedding"):
                continue

            if item["type"] == "article":
                saved = container.repository.save_embedding(
                    EmbeddingRow(
                        article_id=item["id"],
                        vector=item["vector"],
                        main_topic=item["main_topic"],
                        keywords=item["keywords"],
                    )
                )
            else:
                saved = container.video_repository.save_embedding(
                    VideoEmbeddingRow(
                        video_id=item["id"],
                        vector=item["vector"],
                        main_topic=item["main_topic"],
                        keywords=item["keywords"],
                    )
                )
            if not saved.success:
                log.error(saved.error)
            else:
                saved_count += 1

        log.info(
            f"{saved_count} embeddings saved, {len(all_items) - saved_count} reused from DB"
        )

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

        # ── 6. Grouper par cluster ────────────────────────────────────────
        groups = defaultdict(list)
        noise_count = 0
        for item, label in zip(all_items, clusters.value.labels):
            if label == -1:
                noise_count += 1
                continue
            groups[label].append(item)

        log.info(
            f"clustering result: {len(groups)} clusters, {noise_count} noise articles"
        )
        for label_id, members in groups.items():
            log.info(
                f"  cluster {label_id}: {len(members)} articles — ex: {members[0]['title'][:60]}"
            )

        if not groups:
            log.warning("no clusters formed")
            return

        # ── 7. Nommer + sauvegarder ───────────────────────────────────────
        log.info(f"naming {len(groups)} clusters...")

        batch_input = BatchNamingInput(
            clusters=[
                ClusterInput(
                    index=idx,
                    titles=[m["title"] for m in members[:10]],
                    excerpts=[
                        f"Category: {m['main_topic']} | Content: {' '.join(m['chunks'][:1])[:300]}"
                        for m in members[:10]
                    ],
                )
                for idx, (label, members) in enumerate(groups.items())
            ]
        )

        batch_result = container.namer.generate_batch(batch_input)
        if not batch_result.success:
            log.error(batch_result.error)
            return

        group_list = list(groups.values())
        cluster_rows = []

        for i, naming in enumerate(batch_result.value.results):
            members = group_list[i]
            cluster_rows.append(
                ClusterRow(
                    label=naming.label,
                    description=naming.description,
                    article_ids=[m["id"] for m in members if m["type"] == "article"],
                    video_ids=[m["id"] for m in members if m["type"] == "video"],
                )
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
