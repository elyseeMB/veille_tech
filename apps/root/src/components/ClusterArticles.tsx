import { useQuery } from "@tanstack/react-query";
import { clusterQuery } from "@/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleItem } from "@/components/ArticleItem";
import { VideoItem } from "@/components/VideoItem";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

function ClusterSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <Skeleton className="h-5 w-2/3 bg-muted" />
      <Skeleton className="h-3 w-1/3 bg-muted" />
      <Skeleton className="h-20 w-full bg-muted" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full bg-muted" />
      ))}
    </div>
  );
}

export function ClusterArticles({
  id,
  variant,
}: {
  id: string;
  variant: "mobile" | "desktop";
}) {
  const { data, isLoading } = useQuery(clusterQuery(id));
  const navigate = useNavigate();
  const backRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = backRef.current;
    if (!el || variant !== "mobile") {
      document.documentElement.style.setProperty(
        "--cluster-back-height",
        "0px",
      );
      return;
    }

    const measure = () => {
      document.documentElement.style.setProperty(
        "--cluster-back-height",
        `${el.getBoundingClientRect().height}px`,
      );
    };

    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);

    return () => {
      obs.disconnect();
      document.documentElement.style.setProperty(
        "--cluster-back-height",
        "0px",
      );
    };
  }, [variant, data]);

  if (isLoading) {
    return <ClusterSkeleton />;
  }
  if (!data)
    return (
      <p className="text-sm text-muted-foreground p-5">Cluster not found.</p>
    );

  return (
    <div className="flex flex-col">
      {variant === "mobile" && (
        <div
          ref={backRef}
          className="w-full px-4 pt-3 fixed
          bg-background
          top-[calc(var(--tabs-height)_+_var(--header-height))]
          left-0
          z-50
          before:absolute
          before:inset-x-0
          before:top-full
          before:h-6
          before:content-['']
          before:pointer-events-none
          before:bg-gradient-to-b
          before:from-30%
          before:from-background
          before:to-transparent
          "
        >
          <Button
            variant="ghost"
            className="cursor-pointer w-full h-13 rounded-full bg-primary-foreground"
            onClick={() => navigate("/clusters")}
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{data.label}</span>
          </Button>
        </div>
      )}

      {data.items.map((item) =>
        item.type === "article" ? (
          <ArticleItem
            key={item.data.id}
            article={item.data}
            clusterLabel={data.label}
            clusterCreatedAt={data.createdAt}
          />
        ) : (
          <VideoItem key={item.data.id} video={item.data} />
        ),
      )}
    </div>
  );
}
