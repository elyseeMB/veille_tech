import { create } from "zustand";
import type { Article } from "@/hooks/useFeed.ts";

export type ClusterSelection = {
  id: string;
  label: string;
  createdAt: string;
  articles: Article[];
} | null;

interface ClusterStore {
  selectedCluster: ClusterSelection;
  setSelectedCluster: (cluster: ClusterSelection) => void;
}

export const useClusterStore = create<ClusterStore>((set) => ({
  selectedCluster: null,
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
}));
