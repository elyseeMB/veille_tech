import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation, matchPath } from "react-router";
import { clustersQuery } from "@/queries";
import { useBanner } from "./BannerContext.tsx";
import { useSummaryStore } from "@/store/summaryStore.ts";
import { SourcesBadge } from "./SourcesBadge.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import { Button } from "./ui/button.tsx";
import { Skeleton } from "./ui/skeleton.tsx";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import clsx from "clsx";
import { useEffect } from "react";

function ClusterCard({
  label,
  createdAt,
  articleCount,
  sources,
  description,
  selected,
  onSelect,
  isMobile,
}: {
  label: string;
  createdAt: string;
  articleCount: number;
  sources: { name: string; baseUrl: string; type: string }[];
  description?: string;
  selected: boolean;
  onSelect: () => void;
  isMobile: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-2 border-b border-border last:border-0 transition-colors cursor-pointer",
        isMobile ? "w-[calc(100%_+_2rem)] -mx-[1rem] px-[1rem] py-5" : "p-5",
        selected ? "bg-foreground/10" : "hover:bg-foreground/5",
      )}
      onClick={onSelect}
    >
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <TimeRelative date={createdAt} className="text-sm" />
          <span>·</span>
          <span className="flex items-center gap-1 text-sm">
            {articleCount} articles
          </span>
        </div>
        <div className="flex items-center gap-2 w-fit text-lg font-medium font-sans">
          {label}
        </div>
        {sources.length > 0 && (
          <div className="mt-2">
            <SourcesBadge sources={sources} />
          </div>
        )}
      </div>
      {description && (
        <p className="leading-relaxed text-lg lg:text-base text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function SkeletonCard({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-5 border-b border-border",
        isMobile ? "w-[calc(100%_+_2rem)] -mx-[1rem] px-[1rem] py-5" : "p-5",
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 bg-muted" />
        <Skeleton className="h-5 w-2/3 bg-muted" />
        <Skeleton className="h-5 w-1/3 bg-muted" />
        <Skeleton className="h-15 w-full bg-muted" />
      </div>
    </div>
  );
}

export default function ClustersPanel() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: clusters, error, refetch } = useQuery(clustersQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const clusterMatch = matchPath("/clusters/:id", location.pathname);
  const selectedClusterId = clusterMatch?.params.id ?? null;
  const { pushBanner } = useBanner();
  const { setSelectedArticle } = useSummaryStore();

  const handleSelect = (id: string) => {
    const isSelected = selectedClusterId === id;
    if (!isSelected) {
      const cluster = clusters?.find((c) => c.id === id);
      if (cluster) {
        setSelectedArticle(null);
        pushBanner({
          title: cluster.label,
          source: "Cluster",
          pubDate: cluster.createdAt,
          node: null,
        });
      }
      navigate(`/clusters/${id}`);
    } else {
      pushBanner(null);
      navigate("/feed");
    }
  };

  useEffect(() => {
    if (selectedClusterId && clusters) {
      const cluster = clusters.find((c) => c.id === selectedClusterId);
      if (cluster) {
        pushBanner({
          title: cluster.label,
          source: "Cluster",
          pubDate: cluster.createdAt,
          node: null,
        });
      }
    }
  }, [clusters, selectedClusterId]);

  return (
    <section
      className={clsx(
        !isMobile &&
          "border-l border-r border-border overflow-y-auto scrollbar-hide h-[calc(100vh-var(--header-height)-var(--banner-height,0px))]",
      )}
    >
      {error ? (
        <div className="p-2 flex items-center justify-center">
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => refetch()}
          >
            Failed to load clusters — Tap to retry
          </Button>
        </div>
      ) : !clusters || clusters.length === 0 ? (
        <p className="text-sm text-muted-foreground py-5 px-5">
          No clusters yet.
        </p>
      ) : (
        clusters.map((cluster) => (
          <ClusterCard
            key={cluster.id}
            label={cluster.label}
            createdAt={cluster.createdAt}
            articleCount={cluster.articleCount}
            sources={cluster.sources}
            description={cluster.description}
            selected={selectedClusterId === cluster.id}
            onSelect={() => handleSelect(cluster.id)}
            isMobile={isMobile}
          />
        ))
      )}
    </section>
  );
}
