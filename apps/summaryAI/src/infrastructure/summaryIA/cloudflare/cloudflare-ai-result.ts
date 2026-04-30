import { SummaryResultInterface } from "../contracts/summary-result-interface.js";

export type ResultCloudflareAI = {
  result: {
    response: string;
    tool_calls: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      prompt_tokens_details: { cached_tokens: number };
    };
  };
  success: boolean;
  errors: string[];
  messages: string[];
};

export class CloudflareAIResult implements SummaryResultInterface {
  constructor(protected doc: ResultCloudflareAI) {}

  getResponse(): string {
    return this.getItems().response;
  }

  getItems() {
    return this.doc.result;
  }
}
