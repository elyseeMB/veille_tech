#!/bin/sh

set -eu

psql -v ON_ERROR_STOP=1 -U $POSTGRES_USER <<-EOF
CREATE USER veille;
ALTER USER veille WITH SUPERUSER;
ALTER USER veille PASSWORD 'veille';
CREATE DATABASE veille_db;
GRANT ALL PRIVILEGES ON DATABASE veille_db TO veille;
EOF

psql -v ON_ERROR_STOP=1 -U $POSTGRES_USER -d veille_db <<-EOF
ALTER SCHEMA public OWNER TO veille;
GRANT ALL ON SCHEMA public TO veille;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE content_type AS ENUM ('rss', 'youtube');

CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    base_url TEXT,
    type content_type NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE source_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    feed_url TEXT NOT NULL,
    UNIQUE(source_id, category)
);

CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    source_id UUID REFERENCES sources(id),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    source_id UUID REFERENCES sources(id),
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    author TEXT,
    content TEXT,
    summary TEXT,
    embedding vector(1024),
    category TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    source_id UUID REFERENCES sources(id),
    title TEXT NOT NULL,
    description TEXT,
    channel_title TEXT,
    channel_avatar TEXT,
    thumbnail TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT
);

CREATE TABLE article_entities (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, entity_id)
);

CREATE TABLE graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_a UUID REFERENCES articles(id) ON DELETE CASCADE,
    article_b UUID REFERENCES articles(id) ON DELETE CASCADE,
    similarity FLOAT NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_a, article_b)
);

CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_source_id ON articles(source_id);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_embedding ON articles USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_source_id ON videos(source_id);

CREATE INDEX idx_sync_external_id ON sync_log(external_id);
CREATE INDEX idx_sync_source_id ON sync_log(source_id);

CREATE INDEX idx_graph_article_a ON graph_edges(article_a);
CREATE INDEX idx_graph_article_b ON graph_edges(article_b);
CREATE INDEX idx_graph_similarity ON graph_edges(similarity DESC);

EOF