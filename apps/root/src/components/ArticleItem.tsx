import { useMediaQuery } from "@/hooks/useMediaQuery";
import { db } from "@/lib/db";
import { useSummaryStore } from "@/store/summaryStore.ts";
import type { Article } from "@/types";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { Astroid, Eye, Link } from "lucide-react";
import { useRef, type MouseEventHandler } from "react";
import { useBanner } from "./BannerContext.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";

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

const BADGES_MAPPING = {
  "HN Top 100": {
    name: "HN Top 100",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-900/50 border-1",
  },
  "lobsters daily": {
    name: "lobsters daily",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-900/50 border-1",
  },
  "lobsters weekly": {
    name: "lobsters weekly",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-900/50 border-1",
  },
  "lobsters monthly": {
    name: "lobsters monthly",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-900/50 border-1",
  },
  show: {
    name: "HN Show",
    className:
      "bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200 border-fuchsia-200 dark:border-fuchsia-900/50 border-1",
  },
  security: {
    name: "Security",
    className:
      "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-900/50 border-1",
  },
  science: {
    name: "Science",
    className:
      "bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-900/50 border-1",
  },
  space: {
    name: "Space",
    className:
      "bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-200 border-violet-200 dark:border-violet-900/50 border-1",
  },
  ai: {
    name: "AI",
    className:
      "bg-cyan-50 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-200 dark:border-cyan-900/50 border-1",
  },
  computing: {
    name: "Computing",
    className:
      "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/50 border-1",
  },
  climate: {
    name: "Climate",
    className:
      "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-900/50 border-1",
  },
  startup: {
    name: "Startup",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-900/50 border-1",
  },
  engineering: {
    name: "Engineering",
    className:
      "bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-200 dark:border-orange-900/50 border-1",
  },
  "brand/design": {
    name: "Brand/Design",
    className:
      "bg-pink-50 text-pink-900 dark:bg-pink-950 dark:text-pink-200 border-pink-200 dark:border-pink-900/50 border-1",
  },
  business: {
    name: "Business",
    className:
      "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-900/50 border-1",
  },
  backchannel: {
    name: "Backchannel",
    className:
      "bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 border-zinc-200 dark:border-zinc-900/50 border-1",
  },
  ideas: {
    name: "Ideas",
    className:
      "bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900/50 border-1",
  },
};

export function ArticleItem({
  article: item,
  clusterLabel,
  clusterCreatedAt,
}: {
  article: Article;
  clusterLabel?: string;
  clusterCreatedAt?: string;
}) {
  const isDeviceMedium = useMediaQuery("(max-width: 800px)");
  const articleRef = useRef<HTMLElement>(null);
  const { selectedArticle, setSelectedArticle } = useSummaryStore();
  const isSelected = selectedArticle?.id === item.id;
  const isDesktop = !isDeviceMedium;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { pushBanner } = useBanner();

  const handleSelect: MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault();
    if (isSelected) {
      setSelectedArticle(null);
      if (clusterLabel) {
        pushBanner({
          title: clusterLabel,
          source: "Cluster",
          pubDate: clusterCreatedAt || new Date().toISOString(),
          node: null,
        });
      } else {
        pushBanner(null);
      }
    } else {
      pushBanner({
        title: item.title,
        source: item.source,
        pubDate: item.pubDate,
        node: articleRef.current,
        clusterLabel,
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
    }
  };

  const isCategoryDefault = !!BADGES_MAPPING[item.category];

  const readIds = useLiveQuery(
    () =>
      db.clicks
        .orderBy("articleId")
        .uniqueKeys()
        .then((keys) => new Set(keys)),
    [],
    new Set<string>(),
  );

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
            {readIds.has(item.id) && (
              <Badge variant="default" className="-mx-2 flex item-center gap-1">
                <Eye />
                <span>Seen</span>
              </Badge>
            )}

            <div className="w-full flex items-center justify-between">
              <TimeRelative date={item.pubDate} />
              <a
                href={`/r/${item.id}?title=${encodeURIComponent(item.title)}&url=${encodeURIComponent(item.link)}&source=${encodeURIComponent(item.source)}&sourceBaseUrl=${encodeURIComponent(new URL(item.link).hostname)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-xs cursor-pointer z-10 text-muted-foreground flex items-center gap-1"
                >
                  <Link size={12} />
                  read
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full">
              <span
                className={`text-xs uppercase tracking-widest ${SOURCE_COLORS[item.source] ?? "text-muted-foreground"}`}
              >
                {item.source}
              </span>
              <span>·</span>
              <Badge
                className={
                  isCategoryDefault
                    ? BADGES_MAPPING[item.category].className
                    : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/50 border-1"
                }
              >
                {isCategoryDefault ? (
                  <span className="max-w-[200px] truncate">
                    {BADGES_MAPPING[item.category].name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Astroid
                      className="fill-emerald-300 stroke-emerald-300"
                      size={10}
                    />
                    <span className=" max-w-[180px] truncate">
                      {item.category}
                    </span>
                  </span>
                )}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-normal text-muted-foreground">
            <span>{item.author}</span>
          </div>
          <h2 className="text-lg font-medium leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
            {item.title}
          </h2>
          {item.content &&
            !item.content.includes("Comments URL:") &&
            !item.source.includes("Lobsters") && (
              <p className="leading-relaxed text-muted-foreground line-clamp-3">
                {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}
              </p>
            )}

          {item.keywords && (
            <div className="flex -mx-2 flex-wrap gap-1.5">
              {item.keywords.map((keyword) => (
                <Badge variant="secondary" className="border border-border">
                  <span className="max-w-[340px] truncate">{keyword}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
