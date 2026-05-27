import os
from scraper import ArticleScraper, YouTubeScraper
from processing import (
    CloudflareEmbedder,
    Clusterer,
    CloudflareNamer,
    GeminiNamer,
    TextChunker,
    MetadataExtractor,
)
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
        self.metadata_extractor = MetadataExtractor(cf_account_id, cf_api_token)
        self.embedder = CloudflareEmbedder(cf_account_id, cf_api_token)
        self.clusterer = Clusterer()
        namer_provider = os.environ.get("NAMER_PROVIDER", "cloudflare")
        if namer_provider == "gemini":
            gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
            cf_gateway_name = os.environ.get("CF_GATEWAY_NAME", "default")
            cf_api_token_gateway = os.environ.get("CF_API_TOKEN_GATEWAY", "default")
            self.namer = GeminiNamer(
                cf_account_id, cf_gateway_name, cf_api_token_gateway, gemini_api_key
            )
        else:
            self.namer = CloudflareNamer(cf_account_id, cf_api_token)

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
