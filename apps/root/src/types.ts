export type Article = {
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

export type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelAvatar?: string;
  thumbnail: string;
  publishedAt: string;
};

export type FeedItem =
  | { type: "article"; date: Date; data: Article }
  | { type: "video"; date: Date; data: YoutubeVideo }
  | { type: "video_carousel"; date: Date; data: YoutubeVideo[] };

export type ClusterSource = {
  name: string;
  baseUrl: string;
  type: string;
};

export type Cluster = {
  id: string;
  label: string;
  description?: string;
  type: string;
  createdAt: string;
  articleCount: number;
  sources: ClusterSource[];
};

export type ClusterItem =
  | { type: "article"; date: Date; data: Article }
  | { type: "video"; date: Date; data: YoutubeVideo };
