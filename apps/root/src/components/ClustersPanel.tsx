import { useState } from "react";
import { Skeleton } from "./ui/skeleton.tsx";
import { Button } from "./ui/button.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import type { Cluster, ClusterArticle } from "@/hooks/useClusters.ts";
import { useClusterDetail } from "@/hooks/useClusters.ts";

function ClusterCard({
  cluster,
  articles,
  expanded,
  onToggle,
}: {
  cluster: Cluster;
  articles: ClusterArticle[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 border-b border-border last:border-0">
      <div className="bg-muted" />
      <div>
        <button onClick={onToggle} className="text-left w-full cursor-pointer">
          <TimeRelative
            date={cluster.createdAt}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
          />
          <p className="text-base leading-snug mt-1 font-medium text-foreground">
            {cluster.label}
          </p>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 pl-0">
            {articles.map((article) => (
              <div key={article.id} className="text-sm text-muted-foreground">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {article.title}
                </a>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-2">
                  {article.source}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 border-b border-border">
      <Skeleton className="h-full bg-muted" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 bg-muted" />
        <Skeleton className="h-5 w-4/5 bg-muted" />
      </div>
    </div>
  );
}

export function ClustersPanel({
  clusters,
  loading,
  error,
  onRetry,
  baseUrl,
}: {
  clusters: Cluster[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  baseUrl: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [articlesMap, setArticlesMap] = useState<
    Record<string, ClusterArticle[]>
  >({});
  const [loadingArticles, setLoadingArticles] = useState<
    Record<string, boolean>
  >({});
  const { fetchCluster } = useClusterDetail(baseUrl);

  const handleToggle = async (cluster: Cluster) => {
    if (expandedId === cluster.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(cluster.id);

    if (!articlesMap[cluster.id]) {
      setLoadingArticles((prev) => ({ ...prev, [cluster.id]: true }));
      const detail = await fetchCluster(cluster.id);
      if (detail) {
        setArticlesMap((prev) => ({ ...prev, [cluster.id]: detail.articles }));
      }
      setLoadingArticles((prev) => ({ ...prev, [cluster.id]: false }));
    }
  };

  if (loading) {
    return (
      <section>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="p-2 flex items-center justify-center">
        <Button className="cursor-pointer" variant="outline" onClick={onRetry}>
          {error} — Tap to retry
        </Button>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-5 px-5">
        No clusters yet.
      </p>
    );
  }

  return (
    <section className="border-r overflow-y-auto scrollbar-hide border-border top-[var(--header-height)] h-[calc(100vh_-_var(--header-height))]">
      {clusters.map((cluster) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          articles={articlesMap[cluster.id] || []}
          expanded={expandedId === cluster.id}
          onToggle={() => handleToggle(cluster)}
        />
      ))}
      {expandedId && loadingArticles[expandedId] && (
        <div className="pl-[calc(1px_+_1.25rem)] py-2">
          <Skeleton className="h-4 w-full bg-muted" />
        </div>
      )}
    </section>
  );
}
