import { useEffect, useState } from "react";

type GatewayArticle = {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  source: string;
  category: string;
};

type GatewayCluster = {
  id: string;
  label: string;
  createdAt: string;
};

export type Cluster = {
  id: string;
  label: string;
  createdAt: string;
};

export type ClusterArticle = {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  source: string;
};

export type ClusterWithArticles = Cluster & {
  articles: ClusterArticle[];
};

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

  return { clusters, loading, error, retry };
}

export function useClusterDetail(baseUrl: string) {
  const fetchCluster = async (id: string): Promise<ClusterWithArticles | null> => {
    try {
      const res = await fetch(`${baseUrl}/clusters/${id}`).then((r) => r.json());
      return {
        id: res.id,
        label: res.label,
        createdAt: res.createdAt,
        articles: (res.articles || []).map((a: GatewayArticle) => ({
          id: a.id,
          title: a.title,
          link: a.link,
          author: a.author,
          pubDate: a.pubDate,
          source: a.source,
        })),
      };
    } catch {
      return null;
    }
  };

  return { fetchCluster };
}
