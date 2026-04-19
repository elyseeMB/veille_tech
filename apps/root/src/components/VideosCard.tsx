import { useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "./ui/skeleton.tsx";

// --- Types ---
export type YoutubeVideo = {
  kind: string;
  etag: string;
  id: { kind: string; videoId: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
  };
  channelAvatar?: string;
  thumbnail?: string;
};

// --- Mock data ---
export const MOCK_VIDEOS: YoutubeVideo[] = [
  {
    kind: "youtube#searchResult",
    etag: "mock1",
    id: { kind: "youtube#video", videoId: "dQw4w9WgXcQ" },
    snippet: {
      publishedAt: "2026-04-15T14:00:00Z",
      channelId: "UCxH16958KSxT4Z9yL_9JYtw",
      title: "Making-of — FAKER 🐐",
      description:
        "Collaboration commerciale @AdobeFrance. Montage sous After Effects, motion design par @yionidas. Retour sur la création de ce projet ambitieux.",
      thumbnails: {
        default: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg" },
        medium: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
      },
      channelTitle: "Micode",
    },
    channelAvatar: "https://i.pravatar.cc/150?img=1",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  },
  {
    kind: "youtube#searchResult",
    etag: "mock2",
    id: { kind: "youtube#video", videoId: "9bZkp7q19f0" },
    snippet: {
      publishedAt: "2026-04-10T10:30:00Z",
      channelId: "UCxH16958KSxT4Z9yL_9JYtw",
      title: "1089 pixels pour comprendre que vous n'existez pas.",
      description:
        "Hop un pixel. Hop un deuxième. Hop un mille quatre-vingt-neuvième. Une vidéo sur la simulation, la conscience et les limites de la perception humaine.",
      thumbnails: {
        default: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/default.jpg" },
        medium: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg" },
      },
      channelTitle: "Micode",
    },
    channelAvatar: "https://i.pravatar.cc/150?img=1",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
  },
  {
    kind: "youtube#searchResult",
    etag: "mock3",
    id: { kind: "youtube#video", videoId: "L_jWHffIx5E" },
    snippet: {
      publishedAt: "2026-04-01T09:00:00Z",
      channelId: "UCxH16958KSxT4Z9yL_9JYtw",
      title: "Le Jeu de la Vie 2.0",
      description:
        "Cellule cellule cellule. Le jeu de la vie de Conway revisité avec des règles modifiées. Émergence, complexité et auto-organisation expliquées simplement.",
      thumbnails: {
        default: { url: "https://i.ytimg.com/vi/L_jWHffIx5E/default.jpg" },
        medium: { url: "https://i.ytimg.com/vi/L_jWHffIx5E/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg" },
      },
      channelTitle: "Micode",
    },
    channelAvatar: "https://i.pravatar.cc/150?img=1",
    thumbnail: "https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg",
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
    observer.observe(desc);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const thumbnail = item.thumbnail ?? item.snippet.thumbnails.high?.url;

  return (
    <article className="group relative w-[calc(100%_+_2rem)] -mx-[1rem] p-4 lg:w-full lg:mx-0 lg:py-5 lg:px-5 border-b border-t border-border last:border-0 transition-colors hover:bg-foreground/5">
      <a
        href={`https://www.youtube.com/watch?v=${item.id.videoId}`}
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
          {/* Dot de départ */}
          <div
            ref={dotRef}
            className="w-2 h-2 rounded-full mt-4 bg-foreground absolute top-0 left-1/2 -translate-x-1/2"
          />

          {/* Courbe : part du bas du dot, descend et tourne à droite */}
          <div
            className="absolute border-l-2 border-b-2 border-secondary group-hover:border-foreground/30 transition-colors mt-4"
            style={{
              top: `${dotSize}px`, // hauteur réelle du dot
              left: `${barRef?.current?.getBoundingClientRect().width / 2 - 1}px`, // centre bar - 1px border
              width: `${offset - dotSize / 2}px`, // jusqu'au bord gauche du §
              height: `calc(100% - ${dotSize + 16}px)`,
              borderRadius: "0 0 0 10px",
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
                  src={item.channelAvatar}
                  alt=""
                />
              )}
              <span className="text-foreground text-sm">
                {item.snippet.channelTitle}
              </span>
            </div>
            <span className="h-px flex-1 bg-foreground/10" />
            <time>
              {new Date(item.snippet.publishedAt).toLocaleDateString("en", {
                year: "numeric",
                day: "numeric",
                month: "short",
              })}
            </time>
          </div>

          {/* Titre */}
          <h2 className="text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
            {item.snippet.title}
          </h2>

          {/* Thumbnail */}
          {thumbnail && (
            <div className="rounded overflow-hidden border border-border aspect-video w-full">
              <img
                src={thumbnail}
                alt={item.snippet.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description + connecteur */}
          {item.snippet.description && (
            <p
              ref={descRef}
              className="ml-5 pl-1 text-sm leading-relaxed text-muted-foreground"
            >
              {item.snippet.description.slice(0, 120)}…
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
        : videos.map((item, i) => (
            <VideoItem key={item.id.videoId || i} item={item} />
          ))}
    </div>
  );
}
