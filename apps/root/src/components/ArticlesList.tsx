import { Skeleton } from "./ui/skeleton.tsx";

export type Feed = {
  description: string;
  feedUrl: string;
  items: Article[];
  itunes: Record<string, any>;
  language: string;
  lastBuildDate: string;
  link: string;
  paginationLinks: { self: string };
  title: string;
};

export type Article = {
  link: string;
  title: string;
  author: string;
  pubDate: string;
  enclosure?: { url: string };
  content?: string;
};

export function ArticlesList({
  data,
  loading,
}: {
  data?: { hackerNews?: Feed };
  loading: boolean;
}) {
  return (
    <div className="space-y-0">
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
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
        : data?.hackerNews?.items?.map((item, i) => (
            <article
              key={i}
              className="
                group relative grid grid-cols-1 lg:grid-cols-[1px_1fr]
                gap-5
                w-[calc(100%_+_2rem)] -mx-[1rem]
                p-4
                lg:w-full lg:mx-0
                lg:py-5 lg:pl-0 lg:pr-10
                border-b border-border last:border-0
                transition-colors hover:bg-foreground/5"
            >
              <div className="bg-muted opacity-0 transition-colors group-hover:opacity-100 group-hover:bg-foreground" />
              <div className="space-y-3">
                <div className="text-sm">{data.hackerNews.title}</div>
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
                {item.content && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}…
                  </p>
                )}
              </div>
            </article>
          ))}
    </div>
  );
}
