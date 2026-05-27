import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScatterPlot } from "@/components/ScatterPlot";
import { Umap1dTimeline } from "@/components/Umap1dTimeline";
import { ClusterBar } from "@/components/ClusterBar";
import type { ScatterData, Umap1dData } from "@/types";

const source = import.meta.env.VITE_SCATTER_SOURCE ?? "cdn";

const SCATTER_URL =
  source === "local"
    ? "/scatter_latest.json"
    : "https://cdn.veille.safecoffi.app/scatter/latest.json";

const UMAP1D_URL =
  source === "local"
    ? "/scatter_umap1d_latest.json"
    : "https://cdn.veille.safecoffi.app/scatter/umap1d_latest.json";

const scatterQuery = {
  queryKey: ["scatter"],
  queryFn: async (): Promise<ScatterData> => {
    const res = await fetch(SCATTER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  staleTime: 1000 * 60 * 30,
};

const umap1dQuery = {
  queryKey: ["scatter-umap1d"],
  queryFn: async (): Promise<Umap1dData> => {
    const res = await fetch(UMAP1D_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  staleTime: 1000 * 60 * 30,
};

type TabId = "connected" | "umap1d";

export default function ScatterPage() {
  const [tab, setTab] = useState<TabId>("connected");

  const scatter = useQuery(scatterQuery);
  const umap1d = useQuery(umap1dQuery);

  const tabs: { id: TabId; label: string }[] = [
    { id: "connected", label: "\u00c9volution (quinzaine)" },
    { id: "umap1d", label: "Timeline UMAP 1D" },
  ];

  const scatterBarItems = useMemo(
    () =>
      scatter.data?.clusters.map((c) => ({ name: c.name, count: c.volume })) ??
      [],
    [scatter.data],
  );

  const umapBarItems = useMemo(
    () =>
      umap1d.data?.clusters.map((c) => ({
        name: c.name,
        count: umap1d.data.articles.filter((a) => a.clusterId === c.id).length,
      })) ?? [],
    [umap1d.data],
  );

  return (
    <div className="px-10 py-5 space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Clusters</h1>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "connected" && (
        <>
          {scatter.isLoading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          )}
          {scatter.error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-red-500">
                Erreur : {(scatter.error as Error).message}
              </p>
            </div>
          )}
          {scatter.data && (
            <>
              <ClusterBar items={scatterBarItems} />
              <ScatterPlot data={scatter.data} />
              <p className="text-xs text-muted-foreground text-right">
                update
                {new Date(scatter.data.generated_at).toLocaleDateString("en", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          )}
        </>
      )}

      {tab === "umap1d" && (
        <>
          {umap1d.isLoading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          )}
          {umap1d.error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-red-500">
                Erreur : {(umap1d.error as Error).message}
              </p>
            </div>
          )}
          {umap1d.data && (
            <>
              <ClusterBar items={umapBarItems} />
              <Umap1dTimeline data={umap1d.data} />
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                {umap1d.data.articles.length} articles
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
