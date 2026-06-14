import os
import boto3
from shared import Result
from logger import get_logger

log = get_logger("storage")


class AudioStorage:
    def __init__(self):
        self.s3 = boto3.client("s3")
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
            url = f"https://{self.bucket}.s3.amazonaws.com/{key}"
            log.info(f"audio stored — {url}")
            return Result.ok(url)
        except Exception as e:
            log.error(f"s3 storage error: {e}")
            return Result.fail(str(e))
