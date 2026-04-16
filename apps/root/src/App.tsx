import { useEffect, useState } from "react";
import { Calendar } from "./components/Calendar.tsx";

export function App() {
  const [data, setData] = useState<{ hackerNews?: Array<{
    link: string;
    title: string;
    author: string;
    pubDate: string;
    enclosure?: { url: string };
    content?: string;
  }> }>();

  useEffect(() => {
    fetch("http://localhost:4000/rss")
      .then((r) => r.json())
      .then((r) => setData(r))
      .catch((e) => console.error(e));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Veille Technologique
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Actualités et événements tech
          </p>
        </header>

        <section>
          <Calendar />
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-medium text-neutral-700 border-b border-neutral-200 pb-2">
            Articles récents
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data?.hackerNews?.map((item, i) => (
              <article
                key={i}
                className="group relative rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-sm"
              >
                <a href={item.link} className="block">
                  {item.enclosure?.url && (
                    <img
                      src={item.enclosure.url}
                      alt=""
                      className="mb-4 h-40 w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="font-medium text-neutral-900 group-hover:text-neutral-600 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                    <span>{item.author}</span>
                    <span>·</span>
                    <time>{new Date(item.pubDate).toLocaleDateString("fr")}</time>
                  </div>
                  {item.content && (
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                      {item.content.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
