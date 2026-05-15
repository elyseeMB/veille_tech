import os
from scraper     import TrafilaturaScraper
from processing  import CloudflareEmbedder, Clusterer, ClusterNamer
from db          import PostgresConnection
from articles    import MockRepository, PostgresRepository

class Container:
    def __init__(self):
        cf_account_id = os.environ.get("CF_ACCOUNT_ID", "")
        cf_api_token  = os.environ.get("CF_API_TOKEN", "")
        use_mock      = os.environ.get("USE_MOCK", "true") == "true"

        self.scraper   = TrafilaturaScraper()
        self.embedder  = CloudflareEmbedder(cf_account_id, cf_api_token)
        self.clusterer = Clusterer()
        self.namer     = ClusterNamer(cf_account_id, cf_api_token)

        if use_mock:
            self.repository = MockRepository()
        else:
            conn = PostgresConnection()
            self.repository = PostgresRepository(conn)