import requests
from generators.base import AbstractNarrativeGenerator
from shared import Result
from logger import get_logger

log = get_logger("narrative")


class GeminiNarrativeGenerator(AbstractNarrativeGenerator):
    def __init__(
        self,
        cf_account_id: str,
        cf_gateway_name: str,
        cf_api_token_gateway: str,
        gemini_api_key: str,
    ):
        self.url = (
            f"https://gateway.ai.cloudflare.com/v1/{cf_account_id}"
            f"/{cf_gateway_name}/compat/chat/completions"
        )
        self.headers = {
            "Content-Type": "application/json",
            "cf-aig-authorization": f"Bearer {cf_api_token_gateway}",
            "Authorization": f"Bearer {gemini_api_key}",
        }

    def generate(self, run_date: str, clusters: list) -> Result[str]:
        try:
            prompt = self._build_prompt(run_date, clusters)

            response = requests.post(
                self.url,
                headers=self.headers,
                json={
                    "model": "google-ai-studio/gemini-2.5-flash",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.4,
                    "max_tokens": 2000,
                },
                timeout=60,
            )
            response.raise_for_status()
            narrative = response.json()["choices"][0]["message"]["content"].strip()
            log.info(f"narrative generated — {len(narrative)} chars")
            log.info(f"preview: {narrative[:200]}...")
            return Result.ok(narrative)
        except Exception as e:
            log.error(f"narrative generation error: {e}")
            return Result.fail(str(e))

    def _build_prompt(self, run_date: str, clusters: list) -> str:
        clusters_block = ""
        for i, cluster in enumerate(clusters, 1):
            articles_block = "\n".join(
                [
                    f"  - [{a['title']}] ({a['main_topic']})\n"
                    f"    {' '.join(a['chunks'])}"
                    for a in cluster["articles"]
                ]
            )
            clusters_block += (
                f"\n--- Subject {i} : {cluster['label']} ---\n"
                f"Summary : {cluster['description']}\n"
                f"Articles :\n{articles_block}\n"
            )

        return f"""You are a tech journalist writing a daily audio bulletin.

                Bulletin date : {run_date}

                Here are today's major tech trends with their articles:
                {clusters_block}

                INSTRUCTIONS :
                - Write a smooth, natural audio bulletin meant to be read aloud
                - Start with a general hook about the day
                - Cover each topic in 2-3 narrative sentences (no lists, no dashes)
                - Use natural transitions between topics ("Also...", "On the... front...", "Another notable...")
                - End with a closing sentence
                - Tone : professional yet accessible, like tech radio
                - Length : 200 to 300 words maximum
                - Language : english only
                - NO markdown, NO titles, NO symbols — only plain readable text"""
