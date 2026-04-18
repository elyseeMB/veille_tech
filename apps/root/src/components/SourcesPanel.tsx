import { useState } from "react";
import { ChevronRight } from "lucide-react";

const SOURCES = [
  {
    name: "Hacker News",
    count: 18,
    active: true,
    feeds: [
      {
        name: "Front page",
        url: "https://news.ycombinator.com/rss",
        count: 10,
      },
      { name: "Show HN", url: "https://hnrss.org/show", count: 5 },
      { name: "Ask HN", url: "https://hnrss.org/ask", count: 3 },
    ],
  },
  {
    name: "The Verge",
    count: 9,
    active: true,
    feeds: [
      { name: "Tout", url: "https://www.theverge.com/rss/index.xml", count: 5 },
      {
        name: "Tech",
        url: "https://www.theverge.com/rss/tech/index.xml",
        count: 2,
      },
      {
        name: "Science",
        url: "https://www.theverge.com/rss/science/index.xml",
        count: 2,
      },
    ],
  },
  {
    name: "Ars Technica",
    count: 11,
    active: true,
    feeds: [
      {
        name: "Tout",
        url: "https://feeds.arstechnica.com/arstechnica/index",
        count: 6,
      },
      {
        name: "Sécurité",
        url: "https://arstechnica.com/security/feed",
        count: 3,
      },
      { name: "IA", url: "https://arstechnica.com/ai/feed", count: 2 },
    ],
  },
  {
    name: "MIT Tech Review",
    count: 5,
    active: false,
    feeds: [
      { name: "Tout", url: "https://www.technologyreview.com/feed", count: 3 },
      {
        name: "IA",
        url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        count: 2,
      },
    ],
  },
  {
    name: "Wired",
    count: 4,
    active: false,
    feeds: [
      { name: "Tout", url: "https://www.wired.com/feed/rss", count: 2 },
      {
        name: "Sécurité",
        url: "https://www.wired.com/feed/category/security/latest/rss",
        count: 2,
      },
    ],
  },
];

export function SourcesPanel() {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (name: string) =>
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  return (
    <section id="sources">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Sources
        </p>
        <span className="font-mono text-[10px] text-foreground">
          {SOURCES.length}
        </span>
      </div>

      <div className="grid grid-cols-1">
        {SOURCES.map((source) => {
          const isOpen = expanded.includes(source.name);
          return (
            <div
              key={source.name}
              className="border-b border-border last:border-0"
            >
              <div
                onClick={() => toggle(source.name)}
                className="group flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`transition-transform duration-200 select-none text-muted-foreground/50 ${isOpen ? "rotate-90" : ""} inline-block`}
                  >
                    <ChevronRight size={16} />
                  </span>
                  <span
                    className={`flex items-center gap-2 before:rounded-full before:content-[''] before:block before:w-1.5 before:h-1.5 text-sm ${
                      source.active
                        ? "text-foreground before:bg-foreground"
                        : "text-muted-foreground before:bg-muted-foreground/30"
                    }`}
                  >
                    {source.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 -mr-1.5">
                  <span className="font-mono text-[10px] text-foreground">
                    {source.count}
                  </span>
                  <div className="bg-primary w-5 h-5 rounded-full font-mono text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    +2
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border/50">
                  {source.feeds.map((feed, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between pl-10 pr-5 py-2 hover:bg-foreground/5 transition-colors cursor-default group"
                    >
                      <div className="flex items-center gap-2 relative">
                        <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-px bg-border" />
                        <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[120px]">
                          {feed.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 -mr-1.5">
                        <span className="font-mono text-[10px] text-foreground">
                          {feed.count}
                        </span>
                        <div className="bg-primary w-5 h-5 rounded-full font-mono text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                          +2
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
