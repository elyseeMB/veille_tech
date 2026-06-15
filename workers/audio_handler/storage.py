import os
import boto3
from shared import Result
from logger import get_logger

log = get_logger("storage")


class AudioStorage:
    def __init__(self):
        self.endpoint = os.environ.get("S3_ENDPOINT_URL")
        self.s3 = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=os.environ.get("MINIO_ACCESS_KEY"),
            aws_secret_access_key=os.environ.get("MINIO_SECRET_KEY"),
        )
        self.bucket = os.environ["AUDIO_BUCKET"]

    def store(self, audio: bytes, run_date: str) -> Result[str]:
        try:
            key = f"bulletins/{run_date}.mp3"
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=audio,
                ContentType="audio/mpeg",
            )
            if self.endpoint:
                url = f"{self.endpoint}/{self.bucket}/{key}"
            else:
                url = f"https://{self.bucket}.s3.amazonaws.com/{key}"

            log.info(f"audio stored — {url}")
            return Result.ok(url)
        except Exception as e:
            log.error(f"s3 storage error: {e}")
            return Result.fail(str(e))
