import { SummaryAIInterface } from "../contracts/summary-ai-interface.js";
import { SummaryResultInterface } from "../contracts/summary-result-interface.js";
import { SummaryDocument } from "../summary-document.js";
import { ResultCloudflareAI, CloudflareAIResult } from "./cloudflare-ai-result.js";

export class CloudflareAIWorker implements SummaryAIInterface {
  CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  CF_API_TOKEN = process.env.CF_API_TOKEN_CLOUDFLARE_AI;

  async summary(d: SummaryDocument): Promise<SummaryResultInterface> {
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You are an expert technical journalist. When given an article, produce a structured summary in Markdown in the same language as the article.

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
              {
                role: "user",
                content: d.toJSON(),
              },
            ],
          }),
        },
      );
      const doc = (await res.json()) as ResultCloudflareAI;
      return new CloudflareAIResult(doc);
    } catch (error) {
      console.error(error);
      throw new Error("Error Server", { cause: error });
    }
  }
}
