import { create } from "zustand";
import type { ClusterItem } from "@/hooks/useClusters.ts";

export type ClusterSelection = {
  id: string;
  label: string;
  createdAt: string;
  items: ClusterItem[];
} | null;

interface ClusterStore {
  selectedCluster: ClusterSelection;
  setSelectedCluster: (cluster: ClusterSelection) => void;
}

export const useClusterStore = create<ClusterStore>((set) => ({
  selectedCluster: null,
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
}));
