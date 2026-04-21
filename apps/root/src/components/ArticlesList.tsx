import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "./ui/skeleton.tsx";
import { TimeRelative } from "./TimeRelative.tsx";

export type Article = {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  content?: string;
  source: string;
  category: string;
};

const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "text-orange-400",
  "The Verge": "text-violet-400",
  "Ars Technica": "text-red-400",
  "MIT Tech Review": "text-blue-400",
  Wired: "text-emerald-400",
};

export function ArticlesList({
  articles,
  loading,
  loadingMore,
  hasMore,
  loadMore,
}: {
  articles: Article[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}) {
  // Sentinel = div invisible en bas de liste
  // Quand il devient visible → on appelle loadMore
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }, // déclenche quand 10% du sentinel est visible
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <motion.div layout className="space-y-0">
      <AnimatePresence mode="popLayout">
        {loading ? (
          // Skeletons premier chargement
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 mb-9 border-b border-border last:border-0"
            >
              <Skeleton className="h-full bg-muted" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-px flex-1 bg-foreground/10" />
                  <Skeleton className="h-3 w-16 bg-muted" />
                </div>
                <Skeleton className="h-5 w-4/5 bg-muted" />
                <Skeleton className="h-4 w-full bg-foreground/10" />
                <Skeleton className="h-4 w-2/3 bg-foreground/10" />
              </div>
            </div>
          ))
        ) : articles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-5">No articles yet.</p>
        ) : (
          <div>
            {articles.map((item) => (
              <motion.article
                key={item.id}
                className="
                  group relative grid grid-cols-1 lg:grid-cols-[1px_1fr]
                  gap-5
                  w-[calc(100%_+_2rem)] -mx-[1rem]
                  p-4
                  lg:w-full lg:mx-0
                  lg:py-5 lg:pl-0 lg:pr-5
                  border-b border-border last:border-0
                  transition-colors hover:bg-foreground/5 overflow-hidden"
              >
                <div className="bg-muted opacity-0 transition-colors group-hover:opacity-100 group-hover:bg-foreground" />
                <div className="space-y-3 w-full">
                  <div className="flex flex-col items-start gap-1">
                    <TimeRelative date={item.pubDate} />
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs uppercase tracking-widest ${
                          SOURCE_COLORS[item.source] ?? "text-muted-foreground"
                        }`}
                      >
                        {item.source}
                      </span>
                      <span className="text-xs text-muted-foreground/50">
                        ·
                      </span>
                      <span className="text-xs text-muted-foreground/60 capitalize">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{item.author}</span>
                    <span className="h-px flex-1 bg-foreground/10" />
                    <time>
                      {new Date(item.pubDate).toLocaleDateString("en", {
                        year: "numeric",
                        day: "numeric",
                        month: "short",
                      })}
                    </time>
                  </div>

                  <a
                    href={item.link}
                    className="block before:absolute before:content-[''] before:inset-0 before:w-full before:h-full"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h2 className="text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
                      {item.title}
                    </h2>
                  </a>

                  {item.content && !item.content.includes("Comments URL:") && (
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}…
                    </p>
                  )}
                </div>
              </motion.article>
            ))}

            {/* Sentinel — déclenche loadMore quand visible */}
            <div ref={sentinelRef} className="py-1" />

            {/* Spinner chargement page suivante */}
            {loadingMore && (
              <div className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 border-b border-border">
                <Skeleton className="h-full bg-muted" />
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-5 w-4/5 bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-foreground/10" />
                </div>
              </div>
            )}

            {/* Fin du feed */}
            {!hasMore && articles.length > 0 && (
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
