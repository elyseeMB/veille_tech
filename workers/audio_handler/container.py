import os
from generators import GeminiNarrativeGenerator
from synthesizers import PollySynthesizer
from storage import AudioStorage


class Container:
    def __init__(self):
        cf_account_id = os.environ["CF_ACCOUNT_ID"]
        cf_gateway_name = os.environ["CF_GATEWAY_NAME"]
        cf_api_token_gateway = os.environ["CF_API_TOKEN_GATEWAY"]
        gemini_api_key = os.environ["GEMINI_API_KEY"]

        narrative_provider = os.environ.get("NARRATIVE_PROVIDER", "gemini")

        if narrative_provider == "gemini":
            self.narrative_generator = GeminiNarrativeGenerator(
                cf_account_id,
                cf_gateway_name,
                cf_api_token_gateway,
                gemini_api_key,
            )
        else:
            raise ValueError(f"unknown NARRATIVE_PROVIDER: {narrative_provider}")

        synth_provider = os.environ.get("SYNTHESIZER_PROVIDER", "polly")

        if synth_provider == "polly":
            self.audio_synthesizer = PollySynthesizer()
        else:
            raise ValueError(f"unknown SYNTHESIZER_PROVIDER: {synth_provider}")

        self.audio_storage = AudioStorage()
