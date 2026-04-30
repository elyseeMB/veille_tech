import { SummaryAIInterface } from "../contracts/summary-ai-interface.js";
import { SummaryResultInterface } from "../contracts/summary-result-interface.js";
import { SummaryDocument } from "../summary-document.js";
import { ResultGeminiAI, GeminiAIResult } from "./gemini-ai-result.js";

export class GeminiAIWorker implements SummaryAIInterface {
  private readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private readonly MODEL = "gemini-2.0-flash";

  async summary(d: SummaryDocument): Promise<SummaryResultInterface> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: `You are an expert technical journalist. When given an article, produce a structured summary in Markdown in the same language as the article.

## Format to follow

**What it's about**  
1 paragraph — the main subject and context.

**Key points**  
1-2 paragraphs — the important technical details, numbers, or facts worth knowing.

**Why it matters**  
1 paragraph — the impact, implications, or what to take away.

Rules:
- Use the same language as the article
- Be precise, no filler sentences
- If there are key figures or quotes, include them
- Do not use bullet points, only paragraphs`,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: d.toJSON() }],
              },
            ],
          }),
        },
      );

      const doc = (await res.json()) as ResultGeminiAI;
      return new GeminiAIResult(doc);
    } catch (error) {
      console.error(error);
      throw new Error("Error Server", { cause: error });
    }
  }
}
