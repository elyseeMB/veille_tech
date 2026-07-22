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
	keywords?: string[] | null;
};

export type YoutubeVideo = {
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

export type ScatterCluster = {
	id: string;
	name: string;
	volume: number;
	period: string;
	link?: string;
};

export type ScatterData = {
	generated_at: string;
	periods: string[];
	clusters: ScatterCluster[];
};

export type Umap1dArticle = {
	title: string;
	pubDate: string;
	clusterId: string;
	clusterName: string;
	link: string;
};

export type Umap1dCluster = {
	id: string;
	name: string;
};

export type Umap1dData = {
	generated_at: string;
	month: string;
	articles: Umap1dArticle[];
	clusters: Umap1dCluster[];
};
