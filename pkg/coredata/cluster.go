package coredata

import "time"

type ClusterDB struct {
	ID           string    `db:"id" json:"id"`
	Label        string    `db:"label" json:"label"`
	Description  string    `db:"description" json:"description"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
	ArticleCount int       `db:"article_count" json:"articleCount"`
	Type         string    `db:"type" json:"type"`
}

type ClusterDTO struct {
	ClusterDB `json:",inline"`
	Sources   []SourceDTO  `json:"sources"`
	Articles  []ArticleDTO `json:"articles,omitempty"`
	Videos    []VideoDTO   `json:"videos"`
}

func ToClusterDTO(db ClusterDB, sources []SourceDTO, articles []ArticleDTO, videos []VideoDTO) ClusterDTO {
	return ClusterDTO{
		ClusterDB: ClusterDB{
			ID:           db.ID,
			Label:        db.Label,
			Description:  db.Description,
			CreatedAt:    db.CreatedAt,
			ArticleCount: db.ArticleCount,
			Type:         db.Type,
		},
		Sources:  sources,
		Articles: articles,
		Videos:   videos,
	}
}
