package models

import "time"

// ─── Row brut retourné par feed_items ───────────────────────────────────────

type FeedItemRow struct {
	ID          string    `db:"id"`
	Type        string    `db:"type"` // "article" | "video"
	RefID       string    `db:"ref_id"`
	PublishedAt time.Time `db:"published_at"`
}

// ─── Item hydraté renvoyé au front ──────────────────────────────────────────

type FeedItem struct {
	Type string      `json:"type"`
	Date string      `json:"date"`
	Data interface{} `json:"data"`
}

// ─── Réponse paginée ────────────────────────────────────────────────────────

type FeedResponse struct {
	Items   []FeedItem `json:"items"`
	Total   int        `json:"total"`
	Page    int        `json:"page"`
	PerPage int        `json:"per_page"`
}

// ─── Carousel ───────────────────────────────────────────────────────────────

type VideoCarouselGroup struct {
	PubDate string     `json:"pubDate"`
	Items   []VideoDTO `json:"items"`
}
