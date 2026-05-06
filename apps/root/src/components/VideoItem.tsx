import { useEffect, useRef, useState } from "react";
import { TimeRelative } from "./TimeRelative.tsx";
import type { YoutubeVideo } from "@/hooks/useFeed.ts";
import clsx from "clsx";
import { useMobile } from "@/hooks/useMobile.ts";

export function VideoItem({ video: item }: { video: YoutubeVideo }) {
  const isMobile = useMobile();
  const articleRef = useRef<HTMLElement>(null);
  const [isInsideCarousel, setInsideCarousel] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

  useEffect(() => {
    const node = articleRef.current;
    if (!node) return;

    const isInsideElement = node.closest('[data-slot="carousel-item"]');
    setInsideCarousel(!!isInsideElement);
  }, []);

  return (
    <article
      ref={articleRef}
      className={clsx(
        isInsideCarousel && "border-none",
        "group relative w-[calc(100%_+_2rem)] -mx-[1rem] p-4 lg:w-full lg:mx-0 lg:py-5 lg:pl-0 lg:pr-5 border-b border-border transition-colors",
        !isInsideCarousel && "hover:bg-foreground/5",
      )}
    >
      <a
        href={`https://www.youtube.com/watch?v=${item.id}`}
        target="_blank"
        rel="noreferrer"
        className="before:absolute before:content-[''] before:inset-0 before:w-full before:h-full z-10"
      />
      <div className={clsx(!isMobile && "grid grid-cols-[1px_1fr] gap-5")}>
        {!isMobile && (
          <div
            className={clsx(
              !isInsideCarousel &&
                "bg-muted opacity-0 transition-colors group-hover:opacity-100 group-hover:bg-foreground",
            )}
          />
        )}
        <div className="flex flex-col gap-3 flex-1 min-w-0 pb-1">
          <TimeRelative date={item.publishedAt} />

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <div className="flex items-center gap-2 font-serif">
              {item.channelAvatar && (
                <img
                  className="object-cover w-10 rounded-full inline-block"
                  src={
                    item.channelAvatar.startsWith("http")
                      ? item.channelAvatar
                      : `${API_URL}${item.channelAvatar}`
                  }
                  alt=""
                />
              )}
              <span className="text-foreground text-[10px]">
                {item.channelTitle}
              </span>
            </div>
            <span className="h-px flex-1 bg-foreground/10" />
            <time>
              {new Date(item.publishedAt).toLocaleDateString("en", {
                year: "numeric",
                day: "numeric",
                month: "short",
              })}
            </time>
          </div>

          {item.thumbnail && (
            <div className="rounded overflow-hidden border border-border aspect-video w-full">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h2 className="font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
            {item.title}
          </h2>
        </div>
      </div>
    </article>
  );
}
