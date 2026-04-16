import { useEffect, useState } from "react";
import { Calendar } from "./components/Calendar.tsx";

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

  useEffect(() => {
    fetch("http://localhost:4000/rss")
      .then((r) => r.json())
      .then((r) => setData(r))
      .catch((e) => console.error(e));
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 font-serif">
      {/* Conteneur centré avec symétrie parfaite */}
      <div className="mx-auto max-w-5xl px-12 py-20">
        {/* Grille 2 colonnes égales — le séparateur est un border-left sur la colonne droite */}
        <div className="grid grid-cols-2 border-l border-stone-200">
          {/* ── Colonne gauche ── */}
          <div className="border-r border-stone-200 px-10 py-0">
            {/* En-tête */}
            <header className="space-y-6 mb-16">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">
                Collection
              </p>
              <h1 className="text-[40px] font-normal leading-none tracking-tight text-stone-900">
                Veille
                <br />
                Tech
              </h1>
              <div className="h-px w-full bg-stone-200" />
              <p className="text-sm leading-relaxed text-stone-400">
                Articles et événements
                <br />
                de la semaine
              </p>
            </header>

            {/* Calendrier */}
            <section className="border border-stone-200 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 mb-4">
                Calendrier
              </p>
              <Calendar />
            </section>
          </div>

          {/* ── Colonne droite ── */}
          <div className="px-10 py-0">
            {/* En-tête de section — même hauteur que le header gauche */}
            <div className="mb-16">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 mb-3">
                Édition 2026
              </p>
              <div className="h-px w-full bg-stone-200" />
            </div>

            {/* Liste d'articles */}
            <div className="space-y-0">
              {data?.hackerNews?.map((item, i) => (
                <article
                  key={i}
                  className="group grid grid-cols-[1px_1fr] gap-5 pb-9 mb-9 border-b border-stone-100 last:border-0"
                >
                  {/* Trait latéral accent */}
                  <div className="bg-stone-200 transition-colors group-hover:bg-stone-900" />

                  <div className="space-y-3">
                    {/* Méta */}
                    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                      <span>{item.author}</span>
                      <span className="h-px flex-1 bg-stone-100" />
                      <time>
                        {new Date(item.pubDate).toLocaleDateString("fr", {
                          day: "numeric",
                          month: "short",
                        })}
                      </time>
                    </div>

                    {/* Titre */}
                    <a href={item.link} className="block">
                      <h2 className="text-[17px] font-normal leading-snug tracking-[-0.01em] text-stone-900 transition-colors group-hover:text-stone-500">
                        {item.title}
                      </h2>
                    </a>

                    {/* Extrait */}
                    {item.content && (
                      <p className="text-sm leading-relaxed text-stone-400">
                        {item.content.replace(/<[^>]*>/g, "").slice(0, 140)}…
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
        <footer className="border-x border-b border-stone-200 px-10 py-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-300">
            Veille Tech — 2026
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-300">
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
