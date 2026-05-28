from dotenv import load_dotenv

load_dotenv()

import os
import json
import numpy as np
from datetime import datetime, timezone
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity
from container import Container
from logger import get_logger

log = get_logger("app")
container = None


def load_secrets():
    if os.getenv("AWS_LAMBDA_RUNTIME_API") is None:
        return
    import boto3

    ssm = boto3.client("ssm")
    params = {
        "DATABASE_URL": os.environ.get("DB_PARAM_NAME"),
    }
    for env_key, ssm_path in params.items():
        if ssm_path and (ssm_path.startswith("/") or ssm_path.startswith("veille")):
            try:
                resp = ssm.get_parameter(Name=ssm_path, WithDecryption=True)
                os.environ[env_key] = resp["Parameter"]["Value"]
            except Exception as e:
                log.error(f"failed to load ssm parameter {ssm_path}: {e}")


def get_period_id(dt_str: str) -> str:
    dt = datetime.fromisoformat(dt_str)
    month_key = dt.strftime("%Y-%m")
    day = dt.day
    fortnight = "Q1" if day <= 14 else "Q2"
    return f"{month_key}-{fortnight}"


def generate_calendar_periods(months_back: int = 2) -> list:
    now = datetime.now(timezone.utc)
    periods = []
    for i in range(months_back, -1, -1):
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        month_key = f"{year}-{month:02d}"
        periods.append(f"{month_key}-Q1")
        periods.append(f"{month_key}-Q2")
    return periods


def group_by_period(clusters: list) -> dict:
    groups = defaultdict(list)
    for c in clusters:
        pid = get_period_id(c["created_at"])
        groups[pid].append(c)
    return dict(groups)


def compute_centroids(repository, clusters: list) -> list:
    for c in clusters:
        result = repository.get_cluster_embeddings(c["id"])
        if not result.success or not result.value:
            log.warning(f"no embeddings for cluster {c['label']} ({c['id']})")
            c["centroid"] = None
            continue
        embeddings = np.array(result.value, dtype=np.float64)
        c["centroid"] = np.mean(embeddings, axis=0)
        log.debug(
            f"centroid computed for {c['label']}: {c['volume']} items, {len(c['centroid'])}d"
        )
    return clusters


def match_clusters(periods: dict, threshold: float = 0.85) -> list:
    links = []
    period_ids = sorted(periods.keys())

    for i in range(len(period_ids) - 1):
        curr_id = period_ids[i]
        next_id = period_ids[i + 1]
        curr_clusters = [c for c in periods[curr_id] if c.get("centroid") is not None]
        next_clusters = [c for c in periods[next_id] if c.get("centroid") is not None]

        for c1 in curr_clusters:
            for c2 in next_clusters:
                sim = cosine_similarity([c1["centroid"]], [c2["centroid"]])[0][0]
                if sim >= threshold:
                    links.append(
                        {
                            "from_id": c1["id"],
                            "to_id": c2["id"],
                            "similarity": round(float(sim), 4),
                        }
                    )
                    log.info(
                        f"link: {c1['label']} ({curr_id}) -> {c2['label']} ({next_id}) sim={sim:.4f}"
                    )

    return links


def build_json(clusters: list, links: list) -> dict:
    link_map = defaultdict(str)
    for link in links:
        link_map[link["from_id"]] = link["to_id"]
        link_map[link["to_id"]] = link["from_id"]

    cluster_list = []
    for c in clusters:
        entry = {
            "id": c["id"],
            "name": c["label"],
            "volume": c["volume"],
            "period": get_period_id(c["created_at"]),
        }
        linked_id = link_map.get(c["id"])
        if linked_id:
            entry["link"] = linked_id
        cluster_list.append(entry)

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "periods": generate_calendar_periods(),
        "clusters": cluster_list,
    }


def build_umap1d_json(articles: list) -> dict:
    article_list = []
    cluster_set = {}
    for art in articles:
        article_list.append(
            {
                "title": art["title"],
                "pubDate": art["published_at"],
                "clusterId": art["cluster_id"],
                "clusterName": art["cluster_name"],
                "link": art["link"],
            }
        )
        cluster_set[art["cluster_id"]] = {
            "id": art["cluster_id"],
            "name": art["cluster_name"],
        }

    month_str = (
        articles[0]["published_at"][:7]
        if articles
        else datetime.now(timezone.utc).strftime("%Y-%m")
    )

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "month": month_str,
        "articles": article_list,
        "clusters": list(cluster_set.values()),
    }


def push_to_s3(data: dict, s3, bucket: str, key: str):
    body = json.dumps(data, ensure_ascii=False, indent=2)
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType="application/json",
    )
    log.info(f"scatter JSON pushed to s3://{bucket}/{key} ({len(body)} bytes)")


def handler(event, context):
    global container
    try:
        if container is None:
            load_secrets()
            container = Container()

        log.info("fetching clusters...")
        result = container.repository.get_recent_clusters(days=60)
        if not result.success:
            log.error(f"fetch error: {result.error}")
            return
        clusters = result.value or []
        log.info(f"found {len(clusters)} clusters")

        if not clusters:
            log.warning("no clusters found")
            return

        log.info("computing centroids...")
        clusters = compute_centroids(container.repository, clusters)

        with_centroids = [c for c in clusters if c.get("centroid") is not None]
        log.info(
            f"centroids computed for {len(with_centroids)}/{len(clusters)} clusters"
        )

        log.info("grouping by period...")
        periods = group_by_period(clusters)
        log.info(f"periods found: {list(periods.keys())}")

        log.info("matching clusters across periods...")
        links = match_clusters(periods)
        log.info(f"{len(links)} links found")

        log.info("building JSON...")
        scatter_data = build_json(clusters, links)

        is_mock = os.getenv("USE_MOCK", "true") == "true"
        output_mode = os.getenv("OUTPUT_MODE", "s3")

        if is_mock:
            log.info(
                f"mock mode - scatter JSON:\n{json.dumps(scatter_data, ensure_ascii=False, indent=2)}"
            )
        elif output_mode == "local":
            local_path = os.path.normpath(
                os.path.join(
                    os.path.dirname(__file__),
                    "../../apps/root/public/scatter_latest.json",
                )
            )
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "w", encoding="utf-8") as f:
                json.dump(scatter_data, f, ensure_ascii=False, indent=2)
            log.info(f"scatter JSON written to {local_path}")
        else:
            log.info(f"pushing to s3://{container.s3_bucket}/{container.s3_key}...")
            try:
                push_to_s3(
                    scatter_data, container.s3, container.s3_bucket, container.s3_key
                )
            except Exception as e:
                log.error(f"s3 push failed: {e}")
                return

        # --- UMAP 1D pipeline (current month, per-article) ---
        log.info("building UMAP 1D projection for current month...")
        umap_result = container.repository.get_current_month_articles()
        if umap_result.success and umap_result.value:
            articles = umap_result.value
            log.info(f"found {len(articles)} articles for UMAP 1D")
            if len(articles) >= 5:
                umap_data = build_umap1d_json(articles)

                if is_mock:
                    log.info(
                        f"mock mode - UMAP 1D JSON:\n{json.dumps(umap_data, ensure_ascii=False, indent=2)}"
                    )
                elif output_mode == "local":
                    umap_path = os.path.normpath(
                        os.path.join(
                            os.path.dirname(__file__),
                            "../../apps/root/public/scatter_umap1d_latest.json",
                        )
                    )
                    os.makedirs(os.path.dirname(umap_path), exist_ok=True)
                    with open(umap_path, "w", encoding="utf-8") as f:
                        json.dump(umap_data, f, ensure_ascii=False, indent=2)
                    log.info(f"UMAP 1D JSON written to {umap_path}")
                else:
                    umap_key = "scatter/umap1d_latest.json"
                    log.info(
                        f"pushing UMAP 1D to s3://{container.s3_bucket}/{umap_key}..."
                    )
                    try:
                        push_to_s3(
                            umap_data, container.s3, container.s3_bucket, umap_key
                        )
                    except Exception as e:
                        log.error(f"s3 push failed for UMAP 1D: {e}")
            else:
                log.warning(f"too few articles ({len(articles)}) for UMAP 1D, skipping")
        else:
            log.warning(
                f"UMAP 1D fetch error or empty: {umap_result.error if not umap_result.success else 'empty'}"
            )

        log.info("done")

    except Exception as e:
        log.error(f"handler error: {e}")
        raise


if __name__ == "__main__":
    handler(None, None)
