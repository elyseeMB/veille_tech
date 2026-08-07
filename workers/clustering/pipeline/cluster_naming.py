from collections import defaultdict

from articles import ClusterRow
from logger import get_logger
from processing import NamingInput
from shared import ScrapedItem

log = get_logger("app")


def group_by_label(
    items: list[ScrapedItem], labels: list[int]
) -> tuple[dict[int, list[ScrapedItem]], int]:
    groups: dict[int, list[ScrapedItem]] = defaultdict(list)
    noise_count = 0
    for item, label in zip(items, labels):
        if label == -1:
            noise_count += 1
            continue
        groups[label].append(item)

    log.info(f"clustering result: {len(groups)} clusters, {noise_count} noise articles")
    for label_id, members in groups.items():
        log.info(
            f"  cluster {label_id}: {len(members)} articles — ex: {members[0]['title'][:60]}"
        )

    return groups, noise_count


def build_clusters(
    groups: dict[int, list[ScrapedItem]],
    cohesion_scores: dict[int, float],
    namer,
) -> list[ClusterRow]:
    log.info(f"naming {len(groups)} clusters...")

    cluster_rows = []

    for label, members in groups.items():
        score = cohesion_scores.get(label, 0)
        log.info(
            f"cluster {label} | cohesion={score:.3f} | {len(members)} articles | ex: {members[0]['title'][:50]}"
        )

        naming = namer.generate(
            NamingInput(
                titles=[m["title"] for m in members[:10]],
                excerpts=[
                    f"Category: {m['main_topic']} | Content: {' '.join(m['chunks'][:4])[:1000]}"
                    for m in members[:10]
                ],
            )
        )

        if not naming.success:
            log.error(f"naming error: {naming.error}")
            continue

        log.info(f"cluster named: '{naming.value.label}'")

        outliers = set(naming.value.outlier_titles)
        if outliers:
            log.info(f"cluster {label}: {len(outliers)} outliers removed — {outliers}")

        final_members = [m for m in members if m["title"] not in outliers]

        cluster_rows.append(
            ClusterRow(
                label=naming.value.label,
                description=naming.value.description,
                article_ids=[m["id"] for m in final_members if m["type"] == "article"],
                video_ids=[m["id"] for m in final_members if m["type"] == "video"],
            )
        )

    return cluster_rows
