import { SummaryResultInterface } from "../contracts/summary-result-interface.js";

export type ResultGeminiAI = {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
};

export class GeminiAIResult implements SummaryResultInterface {
  constructor(protected doc: ResultGeminiAI) {
    console.log(doc);
  }

  getResponse(): string {
    return this.doc.candidates[0].content.parts[0].text;
  }
}
