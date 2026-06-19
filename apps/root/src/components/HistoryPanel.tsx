import { useRef, useLayoutEffect } from "react";
import { useHistory } from "@/hooks/useHistory";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "./ui/button";
import { ThumbnailItem } from "./ThumbnailItem";
import { Trash2 } from "lucide-react";
import clsx from "clsx";
import { Skeleton } from "./ui/skeleton.tsx";

export function HistoryPanel() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { clicks, clearHistory, isLoading } = useHistory();
  const backRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = backRef.current;
    if (!el || !isMobile) {
      document.documentElement.style.setProperty(
        "--history-header-height",
        "0px",
      );
      return;
    }

    const measure = () => {
      document.documentElement.style.setProperty(
        "--history-header-height",
        `${el.getBoundingClientRect().height}px`,
      );
    };

    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);

    return () => {
      obs.disconnect();
      document.documentElement.style.setProperty(
        "--history-header-height",
        "0px",
      );
    };
  }, [isMobile, clicks]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh_-_8rem)] border-r p-4 space-y-3">
        <Skeleton className="h-8 w-24 rounded-md" />
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={clsx(
        !isMobile &&
          "border-r border-border sticky overflow-y-auto scrollbar-hide overscroll-contain h-[calc(100vh_-_var(--header-height)_-_var(--banner-height,_0px))]",
      )}
    >
      {isMobile && (
        <div
          ref={backRef}
          className="fixed top-[calc(var(--tabs-height)_+_var(--header-height))] left-0 z-50 w-full bg-background px-4 pt-3 border-b border-border
            before:absolute before:inset-x-0 before:top-full before:h-6 before:content-[''] before:pointer-events-none
            before:bg-gradient-to-b before:from-30% before:from-background before:to-transparent"
        >
          <div
            className={clsx(
              "flex items-center justify-between",
              isMobile && "justify-end",
            )}
          >
            {!isMobile && <span className="text-sm font-medium">History</span>}

            {clicks && clicks.length > 0 && (
              <Button
                variant="destructive"
                onClick={clearHistory}
                className="cursor-pointer w-full h-13 rounded-full"
              >
                <Trash2 size={14} /> Clear history
              </Button>
            )}
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium">History</span>
          {clicks && clicks.length > 0 && (
            <Button
              variant="destructive"
              size="xs"
              onClick={clearHistory}
              className="cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={14} /> clear history
            </Button>
          )}
        </div>
      )}

      <div className={isMobile ? "pt-[var(--history-header-height)]" : ""}>
        {!clicks || clicks.length === 0 ? (
          <div className={isMobile ? "px-4 py-8" : "px-5 py-8"}>
            <p className="text-sm text-muted-foreground">Aucun article lu.</p>
          </div>
        ) : (
          clicks.map((click) => (
            <a
              key={click.id}
              href={click.url}
              target="_blank"
              rel="noreferrer"
              className={clsx(
                "flex flex-col gap-2 border-b border-border last:border-0 hover:bg-foreground/5 transition-colors cursor-pointer",
                isMobile
                  ? "w-[calc(100%_+_2rem)] -mx-[1rem] px-[1rem] py-5"
                  : "px-5 py-3",
              )}
            >
              <div className="flex items-center gap-1.5">
                {click.source && (
                  <ThumbnailItem
                    source={click.source}
                    sourceBaseUrl={click.sourceBaseUrl}
                  />
                )}
                <span>·</span>
                <span className="text-muted-foreground">
                  {new Date(click.clickedAt).toLocaleDateString("en", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="font-medium line-clamp-2 text-lg">{click.title}</p>
            </a>
          ))
        )}
      </div>
    </aside>
  );
}
