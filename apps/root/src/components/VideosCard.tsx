import { useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "./ui/skeleton.tsx";

// --- Types ---
export type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  channelAvatar?: string;
};

// --- Mock data ---
export const MOCK_VIDEOS: YoutubeVideo[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Making-of — FAKER 🐐",
    description:
      "Collaboration commerciale @AdobeFrance. Montage sous After Effects, motion design par @yionidas. Retour sur la création de ce projet ambitieux.",
    channelTitle: "Micode",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    publishedAt: "2026-04-15T14:00:00Z",
    channelAvatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "9bZkp7q19f0",
    title: "1089 pixels pour comprendre que vous n'existez pas.",
    description:
      "Hop un pixel. Hop un deuxième. Hop un mille quatre-vingt-neuvième. Une vidéo sur la simulation, la conscience et les limites de la perception humaine.",
    channelTitle: "Micode",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    publishedAt: "2026-04-10T10:30:00Z",
    channelAvatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "L_jWHffIx5E",
    title: "Le Jeu de la Vie 2.0",
    description:
      "Cellule cellule cellule. Le jeu de la vie de Conway revisité avec des règles modifiées. Émergence, complexité et auto-organisation expliquées simplement.",
    channelTitle: "Micode",
    thumbnail: "https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg",
    publishedAt: "2026-04-01T09:00:00Z",
    channelAvatar: "https://i.pravatar.cc/150?img=1",
  },
];

// --- Sous-composant ---
function VideoItem({ item }: { item: YoutubeVideo }) {
  const barRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [dotSize, setDotSize] = useState(8);
  const [offset, setOffset] = useState(57);
  const [barHeight, setBarHeight] = useState<number | null>(null);

  console.log(item);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const desc = descRef.current;
    const container = containerRef.current;
    if (!bar || !desc || !container) return;

    const update = () => {
      const gap = parseFloat(getComputedStyle(container).gap);
      const ml = parseFloat(getComputedStyle(desc).marginLeft);
      const barWidth = bar.getBoundingClientRect().width;
      setOffset(gap + ml + barWidth / 2);

      if (dotRef.current) {
        setDotSize(dotRef.current.getBoundingClientRect().height);
      }

      const barRect = bar.getBoundingClientRect();
      const descRect = desc.getBoundingClientRect();
      setBarHeight(descRect.top - barRect.top + descRect.height / 2);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);

    const images = container.querySelectorAll("img");
    images.forEach((img) => img.addEventListener("load", update));

    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      images.forEach((img) => img.removeEventListener("load", update));
      window.removeEventListener("resize", update);
    };
  }, []);

  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  return (
    <article className="group relative w-[calc(100%_+_2rem)] -mx-[1rem] p-4 lg:w-full lg:mx-0 lg:py-5 lg:px-5 border-t border-border transition-colors hover:bg-foreground/5">
      <a
        href={`https://www.youtube.com/watch?v=${item.id}`}
        target="_blank"
        rel="noreferrer"
        className="before:absolute before:content-[''] before:inset-0 before:w-full before:h-full z-10"
      />

      <div ref={containerRef} className="flex gap-3">
        {/* Bar gauche */}
        <div
          ref={barRef}
          className="flex-shrink-0 relative"
          style={{
            height: barHeight != null ? `${barHeight}px` : "100%",
            width: "8px",
          }}
        >
          <div
            ref={dotRef}
            className="w-2 h-2 rounded-full mt-4 bg-foreground absolute top-0 left-1/2 -translate-x-1/2"
          />
          <div
            className="absolute border-l-2 border-b-2 border-secondary group-hover:border-foreground/30 transition-colors mt-4"
            style={{
              top: `${dotSize}px`,
              left: `${(barRef.current?.getBoundingClientRect().width ?? 8) / 2 - 1}px`,
              width: `${offset - dotSize / 2}px`,
              height: `calc(100% - ${dotSize + 16}px)`,
              borderRadius: "0 0 0 18px",
            }}
          />
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-3 flex-1 min-w-0 pb-1">
          {/* Header */}
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <div className="flex items-center gap-2 font-serif">
              {item.channelAvatar && (
                <img
                  className="object-cover w-10 rounded-full inline-block"
                  src={`${API_URL}${item.channelAvatar}`}
                  alt=""
                />
              )}
              <span className="text-foreground text-sm">
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

          {/* Titre */}
          <h2 className="text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
            {item.title}
          </h2>

          {/* Thumbnail */}
          {item.thumbnail && (
            <div className="rounded overflow-hidden border border-border aspect-video w-full">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p
              ref={descRef}
              className="ml-5 pl-1 text-sm leading-relaxed text-muted-foreground"
            >
              {item.description.slice(0, 120)}…
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

// --- Composant Principal ---
export function VideosCard({
  data,
  loading,
}: {
  data?: { videos?: YoutubeVideo[] };
  loading: boolean;
}) {
  const videos = data?.videos ?? MOCK_VIDEOS;

  return (
    <div className="space-y-0">
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1px_1fr] gap-5 py-5 pr-5 mb-9 border-b border-border"
            >
              <Skeleton className="h-full bg-muted" />
              <div className="space-y-3">
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-5 w-4/5 bg-muted" />
                <Skeleton className="h-40 w-full bg-muted" />
              </div>
            </div>
          ))
        : videos.map((item, i) => <VideoItem key={item.id || i} item={item} />)}
    </div>
  );
}
