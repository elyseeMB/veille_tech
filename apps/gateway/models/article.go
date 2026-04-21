package models

import "time"

// ArticleDB reflète exactement les colonnes de la DB
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

type VideoDB struct {
	ID            string
	ExternalID    string
	Title         string
	Description   string
	ChannelTitle  string
	ChannelAvatar string
	Thumbnail     string
	PublishedAt   time.Time
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

type VideoDTO struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	ChannelTitle  string `json:"channelTitle"`
	ChannelAvatar string `json:"channelAvatar"`
	Thumbnail     string `json:"thumbnail"`
	PublishedAt   string `json:"publishedAt"`
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

func ToVideoDTO(v VideoDB) VideoDTO {
	return VideoDTO{
		ID:            v.ExternalID,
		Title:         v.Title,
		Description:   v.Description,
		ChannelTitle:  v.ChannelTitle,
		ChannelAvatar: v.ChannelAvatar,
		Thumbnail:     v.Thumbnail,
		PublishedAt:   v.PublishedAt.Format(time.RFC3339),
	}
}

type ArticlesResponse struct {
	Articles []ArticleDTO `json:"articles"`
	Total    int          `json:"total"`
	Page     int          `json:"page"`
	PerPage  int          `json:"per_page"`
}

type VideosResponse struct {
	Videos  []VideoDTO `json:"videos"`
	Total   int        `json:"total"`
	Page    int        `json:"page"`
	PerPage int        `json:"per_page"`
}

type GraphNode struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type GraphEdge struct {
	Source     string  `json:"source"`
	Target     string  `json:"target"`
	Similarity float64 `json:"similarity"`
}

type GraphResponse struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}
