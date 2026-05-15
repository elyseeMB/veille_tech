package models

import "time"

type ClusterDB struct {
	ID        string    `db:"id"`
	Label     string    `db:"label"`
	CreatedAt time.Time `db:"created_at"`
}

type ClusterDTO struct {
	ID        string       `json:"id"`
	Label     string       `json:"label"`
	CreatedAt time.Time    `json:"createdAt"`
	Articles  []ArticleDTO `json:"articles,omitempty"`
}

func ToClusterDTO(db ClusterDB, articles []ArticleDTO) ClusterDTO {
	return ClusterDTO{
		ID:        db.ID,
		Label:     db.Label,
		CreatedAt: db.CreatedAt,
		Articles:  articles,
	}
}
