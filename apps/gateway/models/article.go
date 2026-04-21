package models

import "time"

type Article struct {
	ID          string    `json:"id"`
	ExternalID  string    `json:"external_id"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Author      string    `json:"author"`
	Content     string    `json:"content"`
	Summary     *string   `json:"summary"`
	Category    string    `json:"category"`
	Source      string    `json:"source"`
	PublishedAt time.Time `json:"published_at"`
}

type Video struct {
	ID            string    `json:"id"`
	ExternalID    string    `json:"external_id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	ChannelTitle  string    `json:"channel_title"`
	ChannelAvatar string    `json:"channel_avatar"`
	Thumbnail     string    `json:"thumbnail"`
	PublishedAt   time.Time `json:"published_at"`
}

type PaginatedResponse struct {
	Data    interface{} `json:"data"`
	Total   int         `json:"total"`
	Page    int         `json:"page"`
	PerPage int         `json:"per_page"`
}
