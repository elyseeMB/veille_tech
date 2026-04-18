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

export function App() {
  const desktopHeaderRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );

  const [headerHeight, setHeaderHeight] = useState<number>(80);
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
        console.log(r);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useLayoutEffect(() => {
    const update = () => {
      const desktopH =
        desktopHeaderRef.current?.getBoundingClientRect().height ?? 0;
      const mobileH =
        mobileHeaderRef.current?.getBoundingClientRect().height ?? 0;
      setHeaderHeight(desktopH > 0 ? desktopH : mobileH);
    };

    update();

    const observer = new ResizeObserver(update);
    if (desktopHeaderRef.current) {
      observer.observe(desktopHeaderRef.current);
    }
    if (mobileHeaderRef.current) {
      observer.observe(mobileHeaderRef.current);
    }
    return () => observer.disconnect();
  }, []);

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
          <section className="px-5 py-0">
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
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pt-[var(--header-height)] pb-10 transition-[padding-top] duration-150 ease-out"
      >
        {/* Header Mobile */}
        <div className="lg:hidden mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Collection
          </p>
          <h1 className="text-3xl sm:text-4xl font-normal leading-none tracking-tight text-foreground">
            Veille Tech
          </h1>
        </div>

        {/* Grille Desktop */}
        <div className="hidden lg:grid grid-cols-3 border-l border-border">
          {/* ── Colonne gauche sticky ── */}
          <div className="border-r border-border">
            <div className="sticky overflow-y-auto scrollbar-hide top-[calc(var(--header-height)_+_0.5rem)] h-[calc(100vh_-_var(--header-height)_-_0.5rem)]">
              {/* Sources actives */}

              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  sources
                </p>
                <span className="font-mono text-[10px] text-foreground">5</span>
              </div>

              <div className="grid grid-cols-1">
                {[
                  { name: "Hacker News", count: 18, active: true },
                  { name: "The Verge", count: 9, active: true },
                  { name: "Ars Technica", count: 11, active: true },
                  { name: "MIT Tech Review", count: 5, active: false },
                  { name: "Wired", count: 4, active: false },
                ].map((source) => (
                  <div
                    key={source.name}
                    className="group flex items-center justify-between px-5 py-3 border-b border-border last:border-0 cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          source.active
                            ? "bg-foreground"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          source.active
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {source.name}
                      </span>
                    </div>
                    <span className="bg-secondary w-5 h-5 rounded-full font-mono text-[10px] text-muted-foreground flex items-center justify-center">
                      {source.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-border" />

              {/* Articles épinglés */}
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Épinglés
                </p>
                <span className="font-mono text-[10px] text-foreground">3</span>
              </div>

              <div className="flex flex-col">
                {[
                  {
                    index: "01",
                    title:
                      "CVE-2009-0238 — Faille Excel 17 ans, activement exploitée",
                    source: "CISA",
                    date: "14 avr.",
                  },
                  {
                    index: "02",
                    title:
                      "Meta licencie 5% de ses effectifs, focus sur l'IA générative",
                    source: "The Verge",
                    date: "12 avr.",
                  },
                  {
                    index: "03",
                    title: "Llama 4 : architecture MoE, 10M tokens de contexte",
                    source: "Hacker News",
                    date: "11 avr.",
                  },
                ].map((article) => (
                  <a
                    key={article.index}
                    href="#"
                    className="group relative flex gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-foreground/5 transition-colors"
                  >
                    {/* Numéro */}
                    <span className="font-mono text-[11px] text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors pt-0.5 tabular-nums select-none">
                      {article.index}
                    </span>

                    {/* Contenu */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <p className="text-sm leading-snug text-foreground group-hover:text-muted-foreground transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                          {article.source}
                        </span>
                        <span className="w-px h-2.5 bg-border" />
                        <span className="font-mono text-[10px] text-muted-foreground/40">
                          {article.date}
                        </span>
                      </div>
                    </div>

                    {/* Trait d'accroche gauche au hover */}
                    <span className="absolute left-0 top-3 bottom-3 w-px bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite Desktop */}
          <div className="border-r border-border py-0">
            <ArticlesList data={data} loading={loading} />
          </div>

          {/* third Col */}
          <div className="border-r border-border">
            <div className="sticky overflow-y-auto scrollbar-hide overscroll-contain top-[calc(var(--header-height)_+_0.5rem)] h-[calc(100vh_-_var(--header-height)_-_0.5rem)]">
              <div className="px-5 py-2 flex flex-col gap-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Articles et événements de la semaine
                </p>
                <p className="leading-relaxed">
                  La Cybersecurity and Infrastructure Security Agency (CISA) a
                  ajouté la CVE-2009-0238 à sa liste Known Exploited
                  Vulnerabilities (KEV) le 14 avril 2026, confirmant son
                  exploitation active par des acteurs malveillants.
                </p>

                <p className="leading-relaxed">
                  Cette vulnérabilité critique dans Microsoft Excel, vieille de
                  17 ans, possède un score CVSS v2 de 8.8/10 et permet une
                  exécution de code à distance (RCE) via un débordement de
                  tampon lors du traitement de formules dans des fichiers .xls
                  malveillants.
                </p>

                <p className="leading-relaxed">
                  Les attaques se propagent principalement par phishing,
                  utilisant des macros ou objets embarqués pour injecter du code
                  arbitraire, compromettant totalement le système hôte et
                  favorisant le déploiement de malwares comme les RATs ou
                  stealers.
                </p>

                <p className="leading-relaxed">
                  Découverte en 2009 et patchée par Microsoft (MS09-017), elle
                  persiste dans les environnements legacy non mis à jour, y
                  compris Office 2007 et versions antérieures, ainsi que
                  certains systèmes récents sans patches cumulatifs.
                </p>

                <p className="leading-relaxed">
                  CISA impose une deadline stricte aux agences fédérales US :
                  appliquer les correctifs d'ici le 28 avril 2026, suite à une
                  recrudescence d'attaques observée fin 2025 - début 2026
                  [web:1][web:3][web:4].
                </p>

                <p className="leading-relaxed">
                  <strong>Mitigations prioritaires </strong>- Patcher
                  immédiatement tous les déploiements Office (y compris Extended
                  Support).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Mobile */}
        <div className="lg:hidden space-y-0">
          <ArticlesList data={data} loading={loading} />
        </div>

        {/* Pied de page */}
        <footer className="px-0 lg:px-5 py-4 flex items-center justify-between pt-6 -mb-10 border-x border-t border-border">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
              Veille Tech — 2026
            </span>
            <ModeToggle />
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
            {new Date().toLocaleDateString("en", {
              day: "numeric",
              month: "long",
            })}
          </span>
        </footer>
      </div>
    </main>
  );
}
