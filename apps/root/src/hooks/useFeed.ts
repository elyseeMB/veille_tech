import { useEffect, useState } from "react";

export type Article = {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  content?: string;
  source: string;
  category: string;
};

export type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelAvatar?: string;
  thumbnail: string;
  publishedAt: string;
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
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelAvatar?: string;
  thumbnail: string;
  publishedAt: string;
};

export type VideoCarouselItemGroup = {
  pubDate: string;
  items: YoutubeVideo[];
};

export type FeedItem =
  | { type: "article"; date: Date; data: Article }
  | { type: "video"; date: Date; data: YoutubeVideo }
  | { type: "video_carousel"; date: Date; data: YoutubeVideo[] };

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

export function useFeed(baseUrl: string) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PER_PAGE = 20;

  const fetchPage = async (pageToFetch: number) => {
    if (pageToFetch === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const feedRes = await fetch(
        `${baseUrl}/feed?page=${pageToFetch}&per_page=${PER_PAGE}&video_format=carousel`,
      ).then((r) => r.json());

      const mapped: FeedItem[] = [];

      for (const item of feedRes.items) {
        if (item.type === "article") {
          mapped.push({
            type: "article",
            date: new Date(item.date),
            data: toArticle(item.data),
          });
        }

        if (item.type === "video") {
          mapped.push({
            type: "video",
            date: new Date(item.date),
            data: toVideo(item.data),
          });
        }

        if (item.type === "video_carousel") {
          mapped.push({
            type: "video_carousel",
            date: new Date(item.date),
            data: item.data.items.map(toVideo),
          });
        }
      }

      setItems((prev) => (pageToFetch === 1 ? mapped : [...prev, ...mapped]));

      setPage(pageToFetch);
      setHasMore(feedRes.page * feedRes.per_page < feedRes.total);
    } catch (err) {
      console.error("feed fetch failed", err);
      setError("Connexion perdue. Réessaie plus tard.");
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, [baseUrl]);

  const loadMore = () => {
    if (loadingMore || !hasMore || error) return;
    fetchPage(page + 1);
  };

  const retry = () => {
    setError(null);
    setHasMore(true);
    fetchPage(page + 1);
  };

  return { items, loading, loadingMore, hasMore, error, loadMore, retry };
}
