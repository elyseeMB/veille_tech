import { SummaryResultInterface } from "../contracts/summary-result-interface.js";

export type ResultGeminiAI = {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
};

export class GeminiAIResult implements SummaryResultInterface {
  constructor(protected doc: ResultGeminiAI) {
    console.log(doc);
  }

  getResponse(): string {
    // 1. Vérifie d'abord s'il y a une erreur renvoyée par Google
    if (this.doc.error) {
      throw new Error(
        `Erreur Gemini (${this.doc.error.code}): ${this.doc.error.message}`,
      );
    }

    // 2. Vérifie si les candidats existent avant d'y accéder
    if (!this.doc.candidates || this.doc.candidates.length === 0) {
      throw new Error(
        "Gemini n'a renvoyé aucune réponse (candidates est vide).",
      );
    }
    return this.doc.candidates[0].content.parts[0].text;
  }
}
