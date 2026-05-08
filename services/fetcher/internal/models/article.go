package models

import "time"

type Category struct {
	URL      string
	Category string
}

type RSSFeed struct {
	Name       string
	Categories []Category
}

type Article struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Link     string    `json:"link"`
	Author   string    `json:"author"`
	PubDate  time.Time `json:"pubDate"`
	Content  string    `json:"content"`
	Source   string    `json:"source"`
	Category string    `json:"category"`
}
