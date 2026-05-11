import { Skeleton } from "./ui/skeleton.tsx";
import { TimeRelative } from "./TimeRelative.tsx";

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
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  return (
    <article className="group relative w-[calc(100%_+_2rem)] -mx-[1rem] p-4 lg:w-full lg:mx-0 lg:py-5 lg:pl-0 lg:pr-5 border-t border-border transition-colors hover:bg-foreground/5">
      <a
        href={`https://www.youtube.com/watch?v=${item.id}`}
        target="_blank"
        rel="noreferrer"
        className="before:absolute before:content-[''] before:inset-0 before:w-full before:h-full z-10"
      />

      <div className="grid grid-cols-[1px_1fr] gap-5">
        {/* ── Barre gauche 1px ── */}
        <div className="bg-muted opacity-0 transition-colors group-hover:opacity-100 group-hover:bg-foreground" />

        {/* ── Contenu ── */}
        <div className="flex flex-col gap-3 flex-1 min-w-0 pb-1">
          {/* Timestamp relatif */}
          <TimeRelative date={item.publishedAt} />

          {/* Channel header */}
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
          <h2 className="text-lg font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
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
            <p className="pl-1 text-sm leading-relaxed text-muted-foreground">
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
  const videos =
    import.meta.env.APP_ENV === "dev" && !data?.videos
      ? MOCK_VIDEOS
      : (data?.videos ?? []);

  return (
    <div className="space-y-0">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
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
      ) : videos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-5">No videos yet.</p>
      ) : (
        videos.map((item, i) => <VideoItem key={item.id || i} item={item} />)
      )}
    </div>
  );
}
