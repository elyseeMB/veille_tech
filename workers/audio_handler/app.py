from dotenv import load_dotenv

load_dotenv()

import os
import json
import boto3
from container import Container
from logger import get_logger

log = get_logger("audio_handler")
container = None
_ssm_loaded = False


def load_secrets():
    global _ssm_loaded
    if _ssm_loaded:
        return
    if os.getenv("AWS_LAMBDA_RUNTIME_API") is None:
        _ssm_loaded = True
        return
    ssm = boto3.client("ssm")
    params = {
        "AUDIO_BUCKET": os.environ.get("AUDIO_BUCKET"),
        "CF_ACCOUNT_ID": os.environ.get("CF_ACCOUNT_ID"),
        "CF_GATEWAY_NAME": os.environ.get("CF_GATEWAY_NAME"),
        "CF_API_TOKEN_GATEWAY": os.environ.get("CF_API_TOKEN_GATEWAY"),
        "GEMINI_API_KEY": os.environ.get("GEMINI_API_KEY"),
    }
    for env_key, ssm_path in params.items():
        if ssm_path and (ssm_path.startswith("/") or ssm_path.startswith("veille")):
            try:
                resp = ssm.get_parameter(Name=ssm_path, WithDecryption=True)
                os.environ[env_key] = resp["Parameter"]["Value"]
            except Exception as e:
                log.error(f"failed to load ssm parameter {ssm_path}: {e}")
    _ssm_loaded = True


def handler(event, context):
    global container
    try:
        if container is None:
            load_secrets()
            container = Container()

        record = event["Records"][0]
        body = json.loads(record["body"])
        detail = body.get("detail", body)
        run_date = detail["run_date"]
        clusters = detail["clusters"]

        log.info(f"run_date={run_date} | {len(clusters)} clusters received")

        narrative = container.narrative_generator.generate(run_date, clusters)
        if not narrative.success:
            raise Exception(narrative.error)

        audio = container.audio_synthesizer.synthesize(narrative.value)
        if not audio.success:
            raise Exception(audio.error)

        result = container.audio_storage.store(audio.value, run_date)
        if not result.success:
            raise Exception(result.error)

        return {"status": "success", "url": result.value}

    except Exception as e:
        log.error(f"audio handler error: {e}")
        raise


if __name__ == "__main__":
    handler(None, None)
