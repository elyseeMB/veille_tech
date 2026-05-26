package coredata

import "time"

type FeedItemRow struct {
	ID          string    `db:"id"`
	Type        string    `db:"type"`
	RefID       string    `db:"ref_id"`
	PublishedAt time.Time `db:"published_at"`
}

type FeedItem struct {
	Type string      `json:"type"`
	Date string      `json:"date"`
	Data interface{} `json:"data"`
}

type FeedResponse struct {
	Items   []FeedItem `json:"items"`
	Total   int        `json:"total"`
	Page    int        `json:"page"`
	PerPage int        `json:"per_page"`
}

type FeedFilter struct {
	Page    int
	PerPage int
	Types   []string
}
