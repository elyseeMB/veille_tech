import type { Article } from "@/hooks/useFeed.ts";
import { useSummaryStore } from "@/store/summaryStore.ts";
import { useRef, type MouseEventHandler } from "react";
import { useBanner } from "./BannerContext.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import { useMobile } from "@/hooks/useMobile.ts";

const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "text-orange-400",
  "The Verge": "text-violet-400",
  "Ars Technica": "text-red-400",
  "MIT Tech Review": "text-blue-400",
  Wired: "text-emerald-400",
  "Nasdaq Nordic News Releases": "text-[#0098b9]",
  abduzeedo: "text-[#dddddd]",
  TechCrunch: "text-[#68f176]",
};

export function ArticleItem({ article: item }: { article: Article }) {
  const isMobile = useMobile();
  const articleRef = useRef<HTMLElement>(null);
  const { selectedArticle, setSelectedArticle } = useSummaryStore();
  const isSelected = selectedArticle?.id === item.id;
  const { pushBanner } = useBanner();

  const handleSelect: MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault();
    pushBanner({
      title: item.title,
      source: item.source,
      pubDate: item.pubDate,
      node: articleRef.current,
    });

    setSelectedArticle({
      id: item.id,
      title: item.title,
      url: item.link,
      summary: item.summary ?? null,
      pubDate: item.pubDate,
      source: item.source,
      content: item.content,
      node: articleRef.current,
    });
  };

  // useEffect(() => {
  //   const node = articleRef.current;
  //   if (!node) return;

  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (isSelected) setSelectedVisible(entry.isIntersecting);
  //     },
  //     { threshold: 0.1 },
  //   );

  //   observer.observe(node);
  //   return () => observer.disconnect();
  // }, [isSelected]);

  return (
    <>
      {/* {isSelected && !isVisible && (
        <div
          className="fixed left-0 right-0 z-40 flex items-center gap-3 px-12 py-2 bg-secondary backdrop-blur border-b border-border animate-banner"
          style={{ top: "var(--header-height)" }}
        >
          <div className="w-0.5 h-6 rounded-full bg-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">
              {item.source} ·{" "}
              {new Date(item.pubDate).toLocaleDateString("en", {
                day: "numeric",
                month: "short",
              })}
            </p>
            <p className="text-sm font-medium truncate text-foreground">
              {item.title}
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-xs flex gap-1 items-center text-muted-foreground cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              articleRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
          >
            <ArrowDown size="12" />
            Voir
          </Button>
        </div>
      )} */}

      <article
        ref={articleRef}
        onClick={handleSelect}
        key={item.id}
        className={`
        group relative grid grid-cols-1 lg:grid-cols-[1px_1fr]
        gap-5
        w-[calc(100%_+_2rem)] -mx-[1rem]
        p-4
        lg:w-full lg:mx-0
        lg:py-5 lg:pl-0 lg:pr-5
        border-b border-border last:border-0
        transition-colors cursor-pointer overflow-hidden
        ${isSelected ? "bg-foreground/10" : "hover:bg-foreground/5"}
      `}
      >
        {!isMobile && (
          <div
            className={`opacity-0 transition-colors group-hover:opacity-100 group-hover:bg-foreground ${isSelected ? "opacity-100 bg-foreground" : "bg-muted"}`}
          />
        )}

        <div className="space-y-3 w-full">
          <div className="flex flex-col items-start gap-1">
            <TimeRelative date={item.pubDate} />
            <div className="flex items-center gap-2">
              <span
                className={`text-xs uppercase tracking-widest ${SOURCE_COLORS[item.source] ?? "text-muted-foreground"}`}
              >
                {item.source}
              </span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs max-w-60 truncate text-muted-foreground/60 capitalize">
                {item.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>{item.author}</span>
            <span className="h-px flex-1 bg-foreground/10" />
            <time>
              {new Date(item.pubDate).toLocaleDateString("en", {
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
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <h2 className="text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
              {item.title}
            </h2>
          </a>

          {item.content && !item.content.includes("Comments URL:") && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}
            </p>
          )}
        </div>
      </article>
    </>
  );
}
