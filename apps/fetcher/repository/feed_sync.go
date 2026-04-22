package repository

import (
	"context"
	"time"

	"gateway/config"
)

type FeedFilter struct {
	Page    int
	PerPage int
	Types   []string
}

func SyncFeedItem(itemType string, refID string, publishedAt time.Time) error {
	_, err := config.DB.Exec(
		context.Background(),
		`INSERT INTO feed_items (type, ref_id, published_at)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (type, ref_id) DO NOTHING`,
		itemType, refID, publishedAt,
	)
	return err
}
