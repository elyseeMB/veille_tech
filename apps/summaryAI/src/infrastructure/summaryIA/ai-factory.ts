import { SummaryAIInterface } from "./contracts/summary-ai-interface.js";
import { CloudflareAIWorker } from "./cloudflare/cloudflare-ai-worker.js";
import { GeminiAIWorker } from "./gemini/gemini-ai-worker.js";

export type AIProvider = "cloudflare" | "gemini";

export class AIFactory {
  static create(provider: AIProvider): SummaryAIInterface {
    switch (provider) {
      case "cloudflare":
        return new CloudflareAIWorker();
      case "gemini":
        return new GeminiAIWorker();
      default:
        throw new Error(`Invalid AI provider: ${provider}. Use "cloudflare" or "gemini"`);
    }
  }
}
