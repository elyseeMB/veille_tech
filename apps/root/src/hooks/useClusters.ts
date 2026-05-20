import { useEffect, useState } from "react";
import type { Article, YoutubeVideo } from "./useFeed.ts";

type GatewaySource = {
  name: string;
  baseUrl: string;
  type: string;
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

type GatewayVideo = {
  channelAvatar: string;
  channelTitle: string;
  description: string;
  externalID: string;
  id: string;
  publishedAt: string;
  thumbnail: string;
  title: string;
};

type GatewayCluster = {
  id: string;
  label: string;
  description?: string;
  type: string;
  createdAt: string;
  articleCount: number;
  sources: GatewaySource[];
  articles: GatewayArticle[];
  videos: GatewayVideo[];
};

export type Cluster = {
  id: string;
  label: string;
  description?: string;
  type: string;
  createdAt: string;
  articleCount: number;
  sources: GatewaySource[];
};

// --- MÊME LOGIQUE QUE LE FEED ---
export type ClusterItem =
  | { type: "article"; date: Date; data: Article }
  | { type: "video"; date: Date; data: YoutubeVideo };

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

function toVideo(v: GatewayVideo): YoutubeVideo {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    channelTitle: v.channelTitle,
    channelAvatar: v.channelAvatar,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt,
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
        description: c.description ?? null,
        articleCount: c.articleCount,
        type: c.type ?? "article",
        sources: (c.sources || []).map((s: GatewaySource) => ({
          name: s.name,
          baseUrl: s.baseUrl,
          type: s.type,
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

  return { clusters, loading, error, retry };
}

export async function fetchClusterItems(
  baseUrl: string,
  id: string,
): Promise<ClusterItem[]> {
  try {
    const res: GatewayCluster = await fetch(`${baseUrl}/clusters/${id}`).then(
      (r) => r.json(),
    );

    const mappedItems: ClusterItem[] = [];

    console.log(res);

    if (res.articles) {
      for (const a of res.articles) {
        mappedItems.push({
          type: "article",
          date: new Date(a.pubDate),
          data: toArticle(a),
        });
      }
    }

    if (res.videos) {
      for (const v of res.videos) {
        mappedItems.push({
          type: "video",
          date: new Date(v.publishedAt),
          data: toVideo(v),
        });
      }
    }

    return mappedItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (err) {
    console.error("failed to fetch cluster content", err);
    return [];
  }
}
