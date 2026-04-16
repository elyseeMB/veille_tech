import { useEffect, useState } from "react";
import { Calendar } from "./components/Calendar.tsx";
import { Skeleton } from "./components/ui/skeleton.tsx";
import { ModeToggle } from "./components/Mode-toggle.tsx";

export function App() {
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

  return (
    <main className="min-h-screen bg-background font-serif">
      {/* Conteneur centré avec symétrie parfaite */}
      <div className="mx-auto max-w-5xl px-12 py-20">
        {/* Grille 2 colonnes égales — le séparateur est un border-left sur la colonne droite */}
        <div className="grid grid-cols-2 border-l border-border">
          {/* ── Colonne gauche sticky ── */}
          <div className="border-r border-border px-10 py-0">
            <div className="sticky top-8">
              {/* En-tête */}
              <header className="space-y-6 mb-16">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Collection
                </p>

                <h1 className="text-[40px] font-normal leading-none tracking-tight text-foreground">
                  Veille Tech
                </h1>
                <div className="h-px w-full bg-muted" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Articles et événements
                  <br />
                  de la semaine
                </p>
              </header>

              {/* Calendrier */}
              <section className="">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
                  Calendrier
                </p>
                <div className="-ml-4">
                  <Calendar />
                </div>
              </section>
            </div>
          </div>

          {/* ── Colonne droite ── */}
          <div className="py-0">
            {/* En-tête de section — même hauteur que le header gauche */}
            <div className="px-5 mb-16">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                Édition 2026
              </p>
              <div className="h-px w-full bg-muted" />
            </div>

            {/* Liste d'articles */}
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
                      className="group grid grid-cols-[1px_1fr] gap-5 py-5 pr-5  border-b border-border last:border-0 transition-colors hover:bg-foreground/5"
                    >
                      {/* Trait latéral accent */}
                      <div className="bg-muted transition-colors group-hover:bg-foreground" />

                      <div className="space-y-3">
                        {/* Méta */}
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

                        {/* Titre */}
                        <a href={item.link} className="block">
                          <h2 className="text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
                            {item.title}
                          </h2>
                        </a>

                        {/* Extrait */}
                        {item.content && (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}
                            …
                          </p>
                        )}

                        {/* Image */}
                        {/* {item.enclosure?.url && (
                          <div className="overflow-hidden">
                            <img
                              src={item.enclosure.url}
                              alt=""
                              className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          </div>
                        )} */}
                      </div>
                    </article>
                  ))}
            </div>
          </div>
        </div>

        {/* Pied de page — pleine largeur, aligné sur les colonnes */}
        <footer className="border-x border-b border-border px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
              Veille Tech — 2026
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
              <ModeToggle />
            </span>
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
