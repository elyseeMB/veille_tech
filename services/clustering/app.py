from dotenv import load_dotenv

load_dotenv()

import os
import boto3
from collections import defaultdict
from container import Container
from processing import NamingInput
from articles import ClusterRow, EmbeddingRow

container = None


def load_secrets():
    if os.getenv("AWS_LAMBDA_RUNTIME_API") is None:
        return

    ssm = boto3.client("ssm")

    params = {
        "DATABASE_URL": os.environ.get("DB_PARAM_NAME"),
        "CF_ACCOUNT_ID": os.environ.get("CF_ACCOUNT_ID"),
        "CF_API_TOKEN": os.environ.get("CF_API_TOKEN"),
    }

    for env_key, ssm_path in params.items():
        if ssm_path and (ssm_path.startswith("/") or ssm_path.startswith("veille")):
            try:
                resp = ssm.get_parameter(Name=ssm_path, WithDecryption=True)
                os.environ[env_key] = resp["Parameter"]["Value"]
            except Exception as e:
                print(f"failed to load ssm parameter {ssm_path}: {e}")


def handler(event, context):
    global container
    try:
        if container is None:
            load_secrets()
            container = Container()

        articles = container.repository.get_articles_without_cluster()
        if not articles.success:
            print(articles.error)
            return
        if not articles.value:
            print("no articles to process")
            return

        scraped = []
        for article in articles.value:
            try:
                result = container.scraper.scrape(article.url)
                if result.success and result.value and result.value.full_text:
                    scraped.append(
                        {
                            "id": article.id,
                            "title": article.title,
                            "full_text": result.value.full_text[:2000],
                        }
                    )
                else:
                    print(
                        f"scraping empty or failed for article {article.id}, skipping"
                    )
                    container.repository.mark_as_skipped(article.id)
            except Exception as scrape_err:
                print(
                    f"error scraping article {article.id} ({article.url}): {scrape_err}"
                )
                container.repository.mark_as_skipped(article.id)

        if not scraped:
            print("no content scraped")
            return

        embeddings = container.embedder.embed_in_batches(
            texts=[a["full_text"] for a in scraped], batch_size=10
        )
        if not embeddings.success:
            print(embeddings.error)
            return

        for article, vector in zip(scraped, embeddings.value.vectors):
            saved = container.repository.save_embedding(
                EmbeddingRow(article_id=article["id"], vector=vector)
            )
            if not saved.success:
                print(saved.error)

        if len(scraped) < 5:
            print(
                f"Nombre d'articles insuffisant ({len(scraped)}) pour générer des clusters. Fin du traitement."
            )
            return

        clusters = container.clusterer.cluster(embeddings.value)
        if not clusters.success:
            print(clusters.error)
            return

        groups = defaultdict(list)
        for article, label in zip(scraped, clusters.value.labels):
            if label == -1:
                continue
            groups[label].append(article)

        cluster_rows = []
        for label, members in groups.items():
            naming = container.namer.generate(
                NamingInput(
                    titles=[a["title"] for a in members],
                    excerpts=[a["full_text"][:1500] for a in members],
                )
            )
            if not naming.success:
                print(naming.error)
                continue
            cluster_rows.append(
                ClusterRow(
                    label=naming.value.label,
                    description=naming.value.description,
                    article_ids=[a["id"] for a in members],
                )
            )

        saved = container.repository.save_clusters(cluster_rows)
        if not saved.success:
            print(saved.error)
            return

        print(f"{len(cluster_rows)} clusters saved")

    except Exception as e:
        print(f"handler error: {e}")


if __name__ == "__main__":
    handler(None, None)
