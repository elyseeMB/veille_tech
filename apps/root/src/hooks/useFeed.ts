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

type ArticlesResponse = {
  articles: GatewayArticle[];
  total: number;
  page: number;
  per_page: number;
};

type VideosResponse = {
  videos: GatewayVideo[];
  total: number;
  page: number;
  per_page: number;
};

export type FeedItem =
  | { type: "article"; date: Date; data: Article }
  | { type: "video"; date: Date; data: YoutubeVideo };

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

  const PER_PAGE = 20;

  const fetchPage = async (pageToFetch: number) => {
    pageToFetch === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      const [articlesRes, videosRes] = await Promise.all([
        fetch(`${baseUrl}/articles?page=${pageToFetch}&per_page=${PER_PAGE}`).then(r => r.json()) as Promise<ArticlesResponse>,
        pageToFetch === 1
          ? fetch(`${baseUrl}/videos`).then(r => r.json()) as Promise<VideosResponse>
          : Promise.resolve(null),
      ]);

      const articleItems: FeedItem[] = articlesRes.articles.map(a => ({
        type: "article",
        date: new Date(a.pubDate || Date.now()),
        data: toArticle(a),
      }));

      const videoItems: FeedItem[] = videosRes
        ? videosRes.videos.map(v => ({
            type: "video",
            date: new Date(v.publishedAt || Date.now()),
            data: toVideo(v),
          }))
        : [];

      const merged = [...articleItems, ...videoItems].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      setItems(prev => pageToFetch === 1 ? merged : [...prev, ...merged]);
      setHasMore(articlesRes.page * articlesRes.per_page < articlesRes.total);
    } catch (err) {
      console.error("feed fetch failed", err);
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

  return { items, loading, loadingMore, hasMore, loadMore };
}