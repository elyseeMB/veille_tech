import type { Article, Cluster, ClusterItem, YoutubeVideo } from "@/types";
import type { ClusterSource } from "@/types";

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
	keywords?: string[] | null;
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
	keywords?: string[] | null;
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
		title: v.title,
		description: v.description,
		channelTitle: v.channelTitle,
		channelAvatar: v.channelAvatar,
		thumbnail: v.thumbnail,
		publishedAt: v.publishedAt,
		keywords: v.keywords ?? [],
	};
}

export async function fetchClusters(baseUrl: string): Promise<Cluster[]> {
	const res = await fetch(`${baseUrl}/clusters`).then((r) => r.json());
	return res.map((c: GatewayCluster) => ({
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
}

export async function fetchCluster(
	baseUrl: string,
	id: string,
): Promise<{
	id: string;
	label: string;
	createdAt: string;
	description?: string;
	type: string;
	articleCount: number;
	sources: ClusterSource[];
	items: ClusterItem[];
}> {
	const res: GatewayCluster = await fetch(`${baseUrl}/clusters/${id}`).then((r) => r.json());

	const items: ClusterItem[] = [];

	if (res.articles) {
		for (const a of res.articles) {
			items.push({
				type: "article",
				date: new Date(a.pubDate),
				data: toArticle(a),
			});
		}
	}

	if (res.videos) {
		for (const v of res.videos) {
			items.push({
				type: "video",
				date: new Date(v.publishedAt),
				data: toVideo(v),
			});
		}
	}

	items.sort((a, b) => b.date.getTime() - a.date.getTime());

	return {
		id: res.id,
		label: res.label,
		createdAt: res.createdAt,
		description: res.description,
		type: res.type ?? "article",
		articleCount: res.articleCount,
		sources: (res.sources || []).map((s: GatewaySource) => ({
			name: s.name,
			baseUrl: s.baseUrl,
			type: s.type,
		})),
		items,
	};
}
