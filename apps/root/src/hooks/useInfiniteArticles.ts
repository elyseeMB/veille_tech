import { useEffect, useState } from "react";
import type { Article } from "@/components/ArticlesList";

type GatewayArticle = {
  id: string;
  title: string;
  link: string; // ← le gateway envoie déjà "link"
  author: string;
  pubDate: string; // ← le gateway envoie déjà "pubDate"
  content?: string;
  summary?: string | null;
  source: string;
  category: string;
};

type ArticlesResponse = {
  articles: GatewayArticle[];
  total: number;
  page: number;
  per_page: number;
};

function toArticle(a: GatewayArticle): Article {
  return {
    id: a.id,
    title: a.title,
    link: a.link,
    author: a.author,
    pubDate: a.pubDate || new Date().toISOString(),
    content: a.summary ?? a.content ?? "",
    source: a.source,
    category: a.category,
  };
}

export function useInfiniteArticles(baseUrl: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PER_PAGE = 20;

  const fetchPage = async (pageToFetch: number) => {
    pageToFetch === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      const res = await fetch(
        `${baseUrl}?page=${pageToFetch}&per_page=${PER_PAGE}`,
      );
      const data: ArticlesResponse = await res.json();
      const newArticles = data.articles.map(toArticle);

      setArticles((prev) =>
        pageToFetch === 1 ? newArticles : [...prev, ...newArticles],
      );
      setHasMore(data.page * data.per_page < data.total);
    } catch (err) {
      console.error("fetch articles failed", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, [baseUrl]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  return { articles, loading, loadingMore, hasMore, loadMore };
}
