DROP TABLE IF EXISTS cluster_items;

CREATE TYPE cluster_type AS ENUM ('article', 'video', 'mixed');
ALTER TABLE clusters ADD COLUMN type cluster_type NOT NULL DEFAULT 'article';

CREATE TABLE article_clusters (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, cluster_id)
);

CREATE TABLE video_clusters (
    video_id   UUID REFERENCES videos(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, cluster_id)
);