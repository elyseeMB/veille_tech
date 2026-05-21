import os
from scraper import ArticleScraper, YouTubeScraper
from processing import CloudflareEmbedder, Clusterer, ClusterNamer, TextChunker
from db import PostgresConnection
from articles import MockRepository, PostgresRepository
from videos import MockVideoRepository, PostgresVideoRepository


class Container:
    def __init__(self):

        cf_account_id = os.environ.get("CF_ACCOUNT_ID", "")
        cf_api_token = os.environ.get("CF_API_TOKEN", "")
        use_mock = os.environ.get("USE_MOCK", "true") == "true"
        disable_youtube = os.environ.get("YOUTUBE_SCRAPING", "true") == "false"

        self.article_scraper = ArticleScraper()
        self.chunker = TextChunker()
        self.embedder = CloudflareEmbedder(cf_account_id, cf_api_token)
        self.clusterer = Clusterer()
        self.namer = ClusterNamer(cf_account_id, cf_api_token)

        if disable_youtube:
            self.youtube_scraper = None
        else:
            self.youtube_scraper = YouTubeScraper()

        if use_mock:
            self.repository = MockRepository()
            self.video_repository = MockVideoRepository()
        else:
            conn = PostgresConnection()
            self.repository = PostgresRepository(conn)
            self.video_repository = PostgresVideoRepository(conn)
