package coredata

import (
	"time"
)

type ArticleDB struct {
	ID          string
	ExternalID  string
	Title       string
	URL         string
	Author      string
	Content     string
	Summary     *string
	Category    string
	Source      string
	PublishedAt time.Time
}

type ArticleDTO struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Link     string  `json:"link"`
	Author   string  `json:"author"`
	PubDate  string  `json:"pubDate"`
	Content  string  `json:"content"`
	Source   string  `json:"source"`
	Category string  `json:"category"`
	Summary  *string `json:"summary"`
}

type ArticlesResponse struct {
	Articles []ArticleDTO `json:"articles"`
	Total    int          `json:"total"`
	Page     int          `json:"page"`
	PerPage  int          `json:"per_page"`
}

type ArticleFilter struct {
	Source   string
	Category string
	Date     string
	Page     int
	PerPage  int
}

func ToArticleDTO(a ArticleDB) ArticleDTO {
	content := a.Content
	if a.Summary != nil && *a.Summary != "" {
		content = *a.Summary
	}
	return ArticleDTO{
		ID:       a.ID,
		Title:    a.Title,
		Link:     a.URL,
		Author:   a.Author,
		PubDate:  a.PublishedAt.Format(time.RFC3339),
		Content:  content,
		Source:   a.Source,
		Category: a.Category,
		Summary:  a.Summary,
	}
}
