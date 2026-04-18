const PINNED = [
  { index: "01", title: "CVE-2009-0238 — Faille Excel 17 ans, activement exploitée",       source: "CISA",        date: "14 avr.", href: "#" },
  { index: "02", title: "Meta licencie 5% de ses effectifs, focus sur l'IA générative",    source: "The Verge",   date: "12 avr.", href: "#" },
  { index: "03", title: "Llama 4 : architecture MoE, 10M tokens de contexte",              source: "Hacker News", date: "11 avr.", href: "#" },
  { index: "04", title: "Llama 4 : architecture MoE, 10M tokens de contexte",              source: "Hacker News", date: "11 avr.", href: "#" },
  { index: "05", title: "Llama 4 : architecture MoE, 10M tokens de contexte",              source: "Hacker News", date: "11 avr.", href: "#" },
  { index: "06", title: "Llama 4 : architecture MoE, 10M tokens de contexte",              source: "Hacker News", date: "11 avr.", href: "#" },
  { index: "07", title: "Llama 4 : architecture MoE, 10M tokens de contexte",              source: "Hacker News", date: "11 avr.", href: "#" },
];

export function PinnedArticles() {
  return (
    <section>
      <div className="h-px w-full bg-border" />

      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Épinglés
        </p>
        <span className="font-mono text-[10px] text-foreground">
          {PINNED.length}
        </span>
      </div>

      <div className="flex flex-col">
        {PINNED.map((article) => (
          <a
            key={article.index}
            href={article.href}
            className="group relative flex gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-foreground/5 transition-colors"
          >
            <span className="font-mono text-[11px] text-muted-foreground group-hover:text-muted-foreground/60 transition-colors pt-0.5 tabular-nums select-none">
              {article.index}
            </span>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-sm leading-snug text-foreground group-hover:text-muted-foreground transition-colors">
                {article.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {article.source}
                </span>
                <span className="w-px h-2.5 bg-border" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {article.date}
                </span>
              </div>
            </div>
            <span className="absolute left-0 top-3 bottom-3 w-px bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </section>
  );
}