
from articles import EmbeddingRow
from logger import get_logger
from shared import ScrapedItem
from videos import VideoEmbeddingRow

log = get_logger("app")


def save_embeddings(
    items: list[ScrapedItem], article_repository, video_repository
) -> int:
    log.info("saving embeddings...")
    saved_count = 0
    for item in items:
        # Skip si embedding récupéré depuis DB — pas besoin de re-sauvegarder
        if item.get("existing_embedding"):
            continue

        if item["type"] == "article":
            saved = article_repository.save_embedding(
                EmbeddingRow(
                    article_id=item["id"],
                    vector=item["vector"],
                    main_topic=item["main_topic"],
                    keywords=item["keywords"],
                )
            )
        else:
            saved = video_repository.save_embedding(
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
        f"{saved_count} embeddings saved, {len(items) - saved_count} reused from DB"
    )

    return saved_count
