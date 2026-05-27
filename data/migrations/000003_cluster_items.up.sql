DROP TABLE IF EXISTS article_clusters;
DROP TABLE IF EXISTS video_clusters;

ALTER TABLE clusters DROP COLUMN IF EXISTS type;

DROP TYPE IF EXISTS cluster_type;

CREATE TABLE cluster_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    type       feed_item_type NOT NULL,
    ref_id     UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (cluster_id, type, ref_id)
);

CREATE INDEX idx_cluster_items_cluster_id ON cluster_items(cluster_id);
CREATE INDEX idx_cluster_items_ref_id     ON cluster_items(ref_id);