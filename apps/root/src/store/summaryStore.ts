import { create } from "zustand";

export type AIModel = "cloudflare" | "gemini" | "claude" | "gpt";

export interface SelectedArticle {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  content?: string;
}

interface SummaryStore {
  selectedArticle: SelectedArticle | null;
  activeModel: AIModel;
  setSelectedArticle: (article: SelectedArticle | null) => void;
  setActiveModel: (model: AIModel) => void;
}

export const useSummaryStore = create<SummaryStore>((set) => ({
  selectedArticle: null,
  activeModel: "cloudflare",
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  setActiveModel: (model) => set({ activeModel: model }),
}));

export const MODEL_LABELS: Record<AIModel, string> = {
  cloudflare: "Llama 3.3 70B",
  gemini: "Gemini 2.5",
  claude: "Claude Haiku",
  gpt: "GPT-4.5",
};
