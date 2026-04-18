import { useEffect, useState } from "react";
import type { Feed } from "@/components/ArticlesList";

export function useArticles(url: string) {
  const [data, setData] = useState<{ hackerNews?: Feed }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((r) => {
        setData(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [url]);

  return { data, loading };
}