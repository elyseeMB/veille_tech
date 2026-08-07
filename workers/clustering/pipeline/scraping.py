from concurrent.futures import ThreadPoolExecutor, as_completed

from logger import get_logger
from shared import ScrapedItem

log = get_logger("app")


def scrape_and_chunk(
    items,
    scrape_fn,
    id_field,
    url_field,
    skip_fn,
    chunker,
    embedder,
    item_type,
) -> list[ScrapedItem]:
    def process_item(item):
        try:
            has_embedding = getattr(item, "embedding", None) is not None
            has_keywords = bool(getattr(item, "keywords", []))
            has_topic = bool(
                getattr(item, "category", "") or getattr(item, "main_topic", "")
            )

            if has_embedding and has_keywords and has_topic:
                log.debug(f"Cache hit: skipping '{item.title}'")
                return {
                    "id": getattr(item, id_field),
                    "title": item.title,
                    "full_text": "",
                    "excerpt": "",
                    "chunks": getattr(item, "chunks", []),
                    "main_topic": getattr(item, "category", "")
                    or getattr(item, "main_topic", ""),
                    "keywords": getattr(item, "keywords", []),
                    "type": item_type,
                    "existing_embedding": item.embedding,
                }

            url_or_id = getattr(item, url_field)
            scraped = scrape_fn(url_or_id)
            if scraped.success and scraped.value and scraped.value.full_text:
                chunks = chunker.chunk(scraped.value.full_text)
                chunks = chunker.select_best_chunks(item.title, chunks, embedder)
                chunks = chunks[:3]

                log.debug(f"--- BEST CHUNKS : {item.title} ---")
                for idx, c in enumerate(chunks):
                    log.debug(f"  Chunk {idx + 1}: {c[:2]}...")

                if not chunks:
                    skip_fn(getattr(item, id_field))
                    return None

                existing_category = getattr(item, "category", "") or getattr(
                    item, "main_topic", ""
                )

                return {
                    "id": getattr(item, id_field),
                    "title": item.title,
                    "full_text": scraped.value.full_text,
                    "excerpt": " ".join(chunks[:5]),
                    "chunks": chunks,
                    "main_topic": existing_category,
                    "keywords": getattr(item, "keywords", []) or [],
                    "type": item_type,
                    "existing_embedding": None,
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
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_item, item): item for item in items}
        for future in as_completed(futures):
            item_result = future.result()
            if item_result:
                result.append(item_result)

    return result
