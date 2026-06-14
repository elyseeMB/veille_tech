import boto3
from synthesizers.base import AbstractAudioSynthesizer
from shared import Result
from logger import get_logger

log = get_logger("synthesizer")


class PollySynthesizer(AbstractAudioSynthesizer):
    def __init__(self):
        self.polly = boto3.client("polly")

    def synthesize(self, text: str) -> Result[bytes]:
        try:
            response = self.polly.synthesize_speech(
                Text=text,
                OutputFormat="mp3",
                VoiceId="Ruth",
                Engine="generative",
            )
            audio = response["AudioStream"].read()
            log.info(f"audio generated — {len(audio)} bytes")
            return Result.ok(audio)
        except Exception as e:
            log.error(f"polly synthesis error: {e}")
            return Result.fail(str(e))
