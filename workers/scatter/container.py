import os
import boto3
from botocore.config import Config as BotoConfig
from db import PostgresConnection
from repository import ScatterRepository, MockScatterRepository


class Container:
    def __init__(self):
        use_mock = os.getenv("USE_MOCK", "true") == "true"
        environment = os.getenv("ENVIRONMENT", "dev")

        self.s3_bucket = os.getenv("S3_BUCKET", "veille-scatter")
        self.s3_key = os.getenv("S3_KEY", "scatter/latest.json")
        self.s3_endpoint = os.getenv("S3_ENDPOINT")

        self.s3 = self._build_s3_client(environment)

        if use_mock:
            self.repository = MockScatterRepository()
        else:
            conn = PostgresConnection()
            self.repository = ScatterRepository(conn)

    def _build_s3_client(self, environment: str):
        kwargs = {}
        if self.s3_endpoint:
            kwargs["endpoint_url"] = self.s3_endpoint
            kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
            kwargs["aws_secret_access_key"] = os.getenv(
                "AWS_SECRET_ACCESS_KEY", "minioadmin"
            )
            kwargs["region_name"] = "us-east-1"
        if environment == "dev":
            kwargs["config"] = BotoConfig(
                connect_timeout=3,
                read_timeout=3,
            )
        return boto3.client("s3", **kwargs)
