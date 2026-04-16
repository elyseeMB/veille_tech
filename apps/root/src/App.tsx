import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Calendar } from "./components/Calendar.tsx";
import { Skeleton } from "./components/ui/skeleton.tsx";
import { ModeToggle } from "./components/Mode-toggle.tsx";

type Article = {
  link: string;
  title: string;
  author: string;
  pubDate: string;
  enclosure?: { url: string };
  content?: string;
};

function ArticlesList({
  data,
  loading,
}: {
  data?: { hackerNews?: Article[] };
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
        : data?.hackerNews?.map((item, i) => (
            <article
              key={i}
              className="
                      group relative grid grid-cols-1 lg:grid-cols-[1px_1fr]
                      gap-5
                      w-[calc(100%_+_2rem)] -mx-[1rem]
                      p-4
                      lg:w-full lg:mx-0
                      lg:py-5 lg:pl-0 lg:pr-5 lg:pr-10
                      border-b border-border last:border-0
                      transition-colors hover:bg-foreground/5"
            >
              <div className="bg-muted opacity-0 transition-colors group-hover:opacity-100 group-hover:bg-foreground" />

              <div className="space-y-3">
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>{item.author}</span>
                  <span className="h-px flex-1 bg-foreground/10" />
                  <time>
                    {new Date(item.pubDate).toLocaleDateString("fr", {
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

export function App() {
  const desktopHeaderRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);

  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

  const [headerHeight, setHeaderHeight] = useState<number>();
  const [data, setData] = useState<{
    hackerNews?: Array<{
      link: string;
      title: string;
      author: string;
      pubDate: string;
      enclosure?: { url: string };
      content?: string;
    }>;
  }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:4000/rss")
      .then((r) => r.json())
      .then((r) => {
        setData(r);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useLayoutEffect(() => {
    const header = isDesktop
      ? desktopHeaderRef.current
      : mobileHeaderRef.current;

    if (!header) {
      return;
    }

    const height = header.getBoundingClientRect().height;
    setHeaderHeight(height);
  }, [isDesktop]);

  return (
    <main className="min-h-screen bg-background font-serif relative">
      {/* ── HEADER FIXE Mobile (remplace l'ancien hidden) ── */}

      <div
        ref={mobileHeaderRef}
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground px-4 mb-2">
            Calendrier
          </p>
          {/* Calendar gère lui-même le scroll container + snap */}
          <Calendar scrollable />
        </div>
      </div>

      {/* CALENDRIER FIXE - Desktop uniquement */}
      <div
        ref={desktopHeaderRef}
        className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="mx-auto max-w-5xl px-12 py-6">
          <section className="px-10 py-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Calendrier
            </p>
            <Calendar />
          </section>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div
        style={{
          "--header-height": `${isDesktop ? headerHeight : headerHeight + 20}px`,
        }}
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-12  pt-[var(--header-height)] pb-10"
      >
        {/* Header Mobile */}
        <div className="lg:hidden mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Collection
          </p>
          <h1 className="text-3xl sm:text-4xl font-normal leading-none tracking-tight text-foreground">
            Veille Tech
          </h1>
          <div className="h-px w-full bg-muted my-4" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Articles et événements
            <br />
            de la semaine
          </p>
        </div>

        {/* Grille Desktop */}
        <div className="hidden lg:grid grid-cols-2 border-l border-border">
          {/* ── Colonne gauche sticky ── */}
          <div className="border-r border-border">
            <div className="sticky top-[calc(var(--header-height)_+_0.5rem)]">
              <header className="mb-16">
                <div className="px-5 py-0 py-3 flex flex-col gap-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Collection
                  </p>

                  <h1 className="text-4xl font-normal leading-none tracking-tight text-foreground">
                    Veille Tech
                  </h1>
                </div>
                <div className="h-px w-full bg-muted" />
                <div className="px-5 py-0 py-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Articles et événements
                    <br />
                    de la semaine
                  </p>
                </div>
              </header>
            </div>
          </div>

          {/* Colonne droite Desktop */}
          <div className="border-r border-border py-0">
            <ArticlesList data={data} loading={loading} />
          </div>
        </div>

        {/* Articles Mobile */}
        <div className="lg:hidden space-y-0">
          <ArticlesList data={data} loading={loading} />
        </div>

        {/* Pied de page */}
        <footer className="px-0 lg:px-10 py-4 flex items-center justify-between mt-10 pt-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
              Veille Tech — 2026
            </span>
            <ModeToggle />
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
            {new Date().toLocaleDateString("fr", {
              day: "numeric",
              month: "long",
            })}
          </span>
        </footer>
      </div>
    </main>
  );
}
