import time

from logger import get_logger
from processing import MetadataInput
from shared import ScrapedItem

log = get_logger("app")


def extract_missing_metadata(items: list[ScrapedItem], metadata_extractor_fn) -> None:
    for item in items:
        if item["keywords"] and item["main_topic"].strip():
            log.debug(
                f"keywords + category exist for '{item['title']}' — skipping extraction"
            )
            continue

        meta_result = metadata_extractor_fn(
            MetadataInput(title=item["title"], chunks=item["chunks"])
        )
        if meta_result.success:
            item["main_topic"] = meta_result.value.main_topic
            item["keywords"] = meta_result.value.keywords
            item["existing_embedding"] = None
        else:
            log.warning(
                f"metadata extraction failed for '{item['title']}': {meta_result.error}"
            )

        time.sleep(0.5)
