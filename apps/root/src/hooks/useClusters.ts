import { useEffect, useState } from "react";
import type { Article } from "./useFeed.ts";

type GatewaySource = {
  name: string;
  baseUrl: string;
};

type GatewayCluster = {
  id: string;
  label: string;
  createdAt: string;
  articleCount: number;
  sources: GatewaySource[];
};

type GatewayArticle = {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  content?: string;
  summary?: string | null;
  source: string;
  category: string;
};

export type Cluster = {
  id: string;
  label: string;
  description?: string;
  createdAt: string;
  articleCount: number;
  sources: GatewaySource[];
};

function toArticle(a: GatewayArticle): Article {
  return {
    id: a.id,
    title: a.title,
    link: a.link,
    author: a.author,
    pubDate: a.pubDate || new Date().toISOString(),
    content: a.content,
    summary: a.summary,
    source: a.source,
    category: a.category,
  };
}

export function useClusters(baseUrl: string) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/clusters`).then((r) => r.json());
      const mapped: Cluster[] = res.map((c: GatewayCluster) => ({
        id: c.id,
        label: c.label,
        createdAt: c.createdAt,
        articleCount: c.articleCount,
        sources: (c.sources || []).map((s: GatewaySource) => ({
          name: s.name,
          baseUrl: s.baseUrl,
        })),
      }));
      setClusters(mapped);
      setError(null);
    } catch {
      setError("Failed to load clusters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [baseUrl]);

  const retry = () => {
    setError(null);
    fetchClusters();
  };

  console.log(clusters);

  return { clusters, loading, error, retry };
}

export async function fetchClusterArticles(
  baseUrl: string,
  id: string,
): Promise<Article[]> {
  try {
    const res = await fetch(`${baseUrl}/clusters/${id}`).then((r) => r.json());
    return (res.articles || []).map(toArticle);
  } catch {
    return [];
  }
}
