package coredata

import "time"

type SourceDB struct {
	ID        string
	Name      string
	BaseURL   string
	Type      string
	Active    bool
	CreatedAt time.Time
}

type SourceDTO struct {
	Name    string `json:"name"`
	BaseUrl string `json:"baseUrl"`
	Type    string `json:"type"`
}

type RSSFeed struct {
	Name       string
	Categories []Category
}

type Category struct {
	URL      string
	Category string
}

type YouTubeChannel struct {
	ID   string
	Name string
}
