import type { Article, FeedItem, YoutubeVideo } from "@/types";

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
  keywords?: string[] | null;
};

type GatewayVideo = {
  id: string;
  externalId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelAvatar?: string;
  thumbnail: string;
  publishedAt: string;
  keywords?: string[] | null;
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
    keywords: a.keywords ?? [],
  };
}

function toVideo(v: GatewayVideo): YoutubeVideo {
  return {
    id: v.id,
    externalId: v.externalId,
    title: v.title,
    description: v.description,
    channelTitle: v.channelTitle,
    channelAvatar: v.channelAvatar,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt,
    keywords: v.keywords ?? [],
  };
}

export async function fetchFeed(
  baseUrl: string,
  page: number,
): Promise<{
  items: FeedItem[];
  hasMore: boolean;
  page: number;
  total: number;
}> {
  const PER_PAGE = 20;
  const res = await fetch(
    `${baseUrl}/feed?page=${page}&per_page=${PER_PAGE}&video_format=carousel`,
  ).then((r) => r.json());

  const mapped: FeedItem[] = [];

  for (const item of res.items) {
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

  return {
    items: mapped,
    hasMore: res.page * res.per_page < res.total,
    page: res.page,
    total: res.total,
  };
}
