import type { Cluster } from "@/hooks/useClusters.ts";
import { fetchClusterArticles } from "@/hooks/useClusters.ts";
import { useClusterStore } from "@/store/clusterStore.ts";
import { SourcesBadge } from "./SourcesBadge.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import { Button } from "./ui/button.tsx";
import { Skeleton } from "./ui/skeleton.tsx";

function ClusterCard({
  cluster,
  selected,
  onSelect,
}: {
  cluster: Cluster;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 p-5 border-b border-border last:border-0 transition-colors cursor-pointer ${
        selected ? "bg-foreground/10" : "hover:bg-foreground/5"
      }`}
      onClick={onSelect}
    >
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <TimeRelative date={cluster.createdAt} className="text-sm" />
          <span className="font-mono text-sm uppercase tracking-[0.25em] text-muted-foreground/50">
            ·
          </span>
          <span className="flex items-center gap-1 text-xs">
            {cluster.articleCount}
          </span>
        </div>
        <div className="flex items-center gap-2 w-fit text-xs font-sans bg-muted border border-border rounded-full px-2.5 py-1 -ml-2.5 before:content-[''] before:block before:w-2 before:h-2 before:bg-secondary-foreground before:rounded-full ">
          {cluster.label}
        </div>

        {cluster.sources.length > 0 && (
          <div className="mt-2">
            <SourcesBadge sources={cluster.sources} />
          </div>
        )}
      </div>
      {cluster.description && (
        <p className="leading-relaxed text-sm">{cluster.description}</p>
      )}
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
  const { selectedCluster, setSelectedCluster } = useClusterStore();

  const handleSelect = async (cluster: Cluster) => {
    if (selectedCluster?.id === cluster.id) {
      setSelectedCluster(null);
      return;
    }
    const articles = await fetchClusterArticles(baseUrl, cluster.id);
    setSelectedCluster({
      id: cluster.id,
      label: cluster.label,
      createdAt: cluster.createdAt,
      articles,
    });
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
    <section className="sticky overflow-y-auto scrollbar-hide overscroll-contain top-[var(--header-height)] h-[calc(100vh_-_var(--header-height))] border-r border-border">
      {clusters.map((cluster) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          selected={selectedCluster?.id === cluster.id}
          onSelect={() => handleSelect(cluster)}
        />
      ))}
    </section>
  );
}
