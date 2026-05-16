package models

import "time"

type ClusterDB struct {
	ID           string    `db:"id"`
	Label        string    `db:"label"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `db:"created_at"`
	ArticleCount int       `db:"article_count"`
}

type SourceDTO struct {
	Name    string `json:"name"`
	BaseUrl string `json:"baseUrl"`
}

type ClusterDTO struct {
	ID           string       `json:"id"`
	Label        string       `json:"label"`
	Description  string       `json:"description"`
	CreatedAt    time.Time    `json:"createdAt"`
	ArticleCount int          `json:"articleCount"`
	Sources      []SourceDTO  `json:"sources"`
	Articles     []ArticleDTO `json:"articles,omitempty"`
}

func ToClusterDTO(db ClusterDB, sources []SourceDTO, articles []ArticleDTO) ClusterDTO {
	return ClusterDTO{
		ID:           db.ID,
		Label:        db.Label,
		Description:  db.Description,
		CreatedAt:    db.CreatedAt,
		ArticleCount: db.ArticleCount,
		Sources:      sources,
		Articles:     articles,
	}
}
