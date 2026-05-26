import { Fragment, lazy, Suspense, useEffect, useRef } from "react";
import { Skeleton } from "./ui/skeleton.tsx";
import type { FeedItem } from "@/types";
import { ArticleItem } from "./ArticleItem.tsx";
import { VideoItem } from "./VideoItem.tsx";
import { Button } from "./ui/button.tsx";
import clsx from "clsx";

const VideoCarouselLazy = lazy(() => import("@/components/VideoCarousel"));

export function Feed({
  items,
  loading,
  loadingMore,
  hasMore,
  loadMore,
  error,
  retry,
}: {
  items: FeedItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  error?: string | null;
  retry?: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0, rootMargin: "700px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const getComponent = (item: FeedItem) => {
    switch (item.type) {
      case "article":
        return <ArticleItem article={item.data} />;
      case "video":
        return <VideoItem video={item.data} />;
      case "video_carousel":
        return item.data.length === 1 ? (
          <VideoItem video={item.data[0]} />
        ) : (
          <Suspense fallback={<CarouselSkeleton />}>
            <VideoCarouselLazy group={item.data} />
          </Suspense>
        );
      default:
        return <div>No Content</div>;
    }
  };

  return (
    <section>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <ItemSkeleton2 key={i} />)
      ) : items.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground py-5">Nothing yet.</p>
      ) : (
        <>
          {items.map((item, i) => (
            <Fragment key={item.date.toString()}>
              {getComponent(item)}
              {i === items.length - 3 && hasMore && (
                <div ref={sentinelRef} aria-hidden="true" />
              )}
            </Fragment>
          ))}
          {loadingMore && <ItemSkeleton />}
        </>
      )}
      {error && (
        <div className="p-2 flex items-center justify-center">
          <Button className="cursor-pointer" variant="outline" onClick={retry}>
            {error} — Tap to retry
          </Button>
        </div>
      )}
    </section>
  );
}

function ItemSkeleton() {
  return (
    <div
      className={clsx(
        "flex flex-col gap-5 w-[calc(100%_+_2rem)] -mx-[1rem] p-4 border-b border-border lg:border-l lg:w-full lg:mx-0 lg:p-5",
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 bg-muted" />
        <Skeleton className="h-5 w-4/5 bg-muted" />
      </div>
    </div>
  );
}

function ItemSkeleton2() {
  return (
    <div
      className={clsx(
        "flex flex-col gap-5 w-[calc(100%_+_2rem)] -mx-[1rem] p-4 lg:border-l lg:w-full lg:mx-0 lg:p-5 border-b border-border last:border-0",
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 bg-muted" />
        <Skeleton className="h-5 w-4/5 bg-muted" />
        <Skeleton className="h-15 w-full bg-foreground/10" />
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 mb-9 border-b border-border">
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 bg-muted" />
        <Skeleton className="h-5 w-4/5 bg-muted" />
        <Skeleton className="h-40 w-full bg-muted" />
      </div>
    </div>
  );
}
