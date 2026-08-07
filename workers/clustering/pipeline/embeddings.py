
from logger import get_logger
from shared import ScrapedItem

log = get_logger("app")


def embed_items(
    items: list[ScrapedItem], embedder
) -> tuple[list[ScrapedItem], str | None]:
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
