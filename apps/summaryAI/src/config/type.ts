// src/db/types.ts
import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

// Enums
export type ContentType = "rss" | "youtube";
export type FeedItemType = "article" | "video";

// Tables
export interface SourcesTable {
  id: Generated<string>;
  name: string;
  base_url: string | null;
  type: ContentType;
  active: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface SourceCategoriesTable {
  id: Generated<string>;
  source_id: string | null;
  category: string;
  feed_url: string;
}

export interface SyncLogTable {
  id: Generated<string>;
  external_id: string;
  source_id: string | null;
  synced_at: Generated<Date>;
}

export interface ArticlesTable {
  id: Generated<string>;
  external_id: string;
  source_id: string | null;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  summary: string | null;
  embedding: string | null; // vector(1024) — géré comme string avec pg
  category: string | null;
  published_at: Date | null;
  created_at: Generated<Date>;
}

export interface VideosTable {
  id: Generated<string>;
  external_id: string;
  source_id: string | null;
  title: string;
  description: string | null;
  channel_title: string | null;
  channel_avatar: string | null;
  thumbnail: string | null;
  published_at: Date | null;
  created_at: Generated<Date>;
}

export interface EntitiesTable {
  id: Generated<string>;
  name: string;
  type: string | null;
}

export interface ArticleEntitiesTable {
  article_id: string;
  entity_id: string;
}

export interface GraphEdgesTable {
  id: Generated<string>;
  article_a: string | null;
  article_b: string | null;
  similarity: number;
  computed_at: Generated<Date>;
}

export interface FeedItemsTable {
  id: Generated<string>;
  type: FeedItemType;
  ref_id: string;
  published_at: Date;
  created_at: Generated<Date>;
}

// Database
export interface Database {
  sources: SourcesTable;
  source_categories: SourceCategoriesTable;
  sync_log: SyncLogTable;
  articles: ArticlesTable;
  videos: VideosTable;
  entities: EntitiesTable;
  article_entities: ArticleEntitiesTable;
  graph_edges: GraphEdgesTable;
  feed_items: FeedItemsTable;
}
