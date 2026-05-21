import type { Article } from "@/hooks/useFeed.ts";
import { useSummaryStore } from "@/store/summaryStore.ts";
import { useRef, type MouseEventHandler } from "react";
import { useBanner } from "./BannerContext.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import { useMobile, useMobileMedium } from "@/hooks/useMobile.ts";
import clsx from "clsx";

const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "text-orange-400",
  "The Verge": "text-violet-400",
  "Ars Technica": "text-red-400",
  "MIT Tech Review": "text-blue-400",
  Wired: "text-sky-500",
  "Nasdaq Nordic News Releases": "text-[#0098b9]",
  abduzeedo: "text-[#dddddd]",
  TechCrunch: "text-[#68f176]",
  Lobsters: "text-red-300",
};

export function ArticleItem({ article: item }: { article: Article }) {
  const isDeviceMedium = useMobileMedium();
  const articleRef = useRef<HTMLElement>(null);
  const { selectedArticle, setSelectedArticle } = useSummaryStore();
  const isSelected = selectedArticle?.id === item.id;
  const { pushBanner } = useBanner();
  const isDesktop = !isDeviceMedium;
  const isMobile = useMobile();

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

  return (
    <>
      <article
        ref={articleRef}
        onClick={handleSelect}
        key={item.id}
        className={clsx(
          "relative p-4 border-b border-border last:border-0 transition-colors cursor-pointer overflow-hidden",
          isMobile && "w-[calc(100%_+_2rem)] -mx-[1rem] px-[1rem]",
          isDesktop &&
            "group relative grid grid-cols-[1px_1fr] gap-5 w-full mx-0 py-5 pl-0 pr-5",
          isSelected ? "bg-foreground/10" : "hover:bg-foreground/5",
        )}
      >
        {isDesktop && (
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
            <h2 className="text-lg font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
              {item.title}
            </h2>
          </a>

          {item.content &&
            !item.content.includes("Comments URL:") &&
            !item.source.includes("Lobsters") && (
              <p className="leading-relaxed text-muted-foreground line-clamp-3">
                {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}
              </p>
            )}
        </div>
      </article>
    </>
  );
}
