import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "./ui/skeleton.tsx";
import type { FeedItem } from "@/hooks/useFeed.ts";
import { ArticleItem } from "./ArticleItem.tsx";
import { VideoItem } from "./VideoItem.tsx";

export function Feed({
  items,
  loading,
  loadingMore,
  hasMore,
  loadMore,
}: {
  items: FeedItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
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
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <motion.div layout className="space-y-0">
      <AnimatePresence mode="popLayout">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 mb-9 border-b border-border last:border-0"
            >
              <Skeleton className="h-full bg-muted" />
              <div className="space-y-3">
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-5 w-4/5 bg-muted" />
                <Skeleton className="h-4 w-full bg-foreground/10" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-5">Nothing yet.</p>
        ) : (
          <div>
            {items.map((item, i) =>
              item.type === "article" ? (
                <ArticleItem key={item.data.id || i} article={item.data} />
              ) : (
                <VideoItem key={item.data.id || i} video={item.data} />
              )
            )}

            <div ref={sentinelRef} className="py-1" />

            {loadingMore && (
              <div className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 border-b border-border">
                <Skeleton className="h-full bg-muted" />
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-5 w-4/5 bg-muted" />
                </div>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <p className="text-center text-xs text-muted-foreground/40 font-mono uppercase tracking-widest py-8">
                — fin —
              </p>
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}