package repository

import (
	"context"
	"gateway/internal/config"
	"gateway/internal/models"
)

// Récupère les clusters récents (sans le détail des articles pour la liste)
func GetRecentClusters() ([]models.ClusterDB, error) {
	query := `SELECT id, label, created_at FROM clusters ORDER BY created_at DESC LIMIT 50`

	rows, err := config.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.ClusterDB
	for rows.Next() {
		var c models.ClusterDB
		if err := rows.Scan(&c.ID, &c.Label, &c.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, nil
}

// Récupère un cluster et TOUS les articles associés via la table de liaison
func GetClusterWithArticles(clusterID string) (models.ClusterDB, []models.ArticleDB, error) {
	var c models.ClusterDB

	// 1. Get Cluster
	err := config.DB.QueryRow(context.Background(),
		"SELECT id, label, created_at FROM clusters WHERE id = $1", clusterID).
		Scan(&c.ID, &c.Label, &c.CreatedAt)
	if err != nil {
		return c, nil, err
	}

	// 2. Get Associated Articles
	query := `
		SELECT a.id, a.external_id, a.title, a.url, COALESCE(a.author, ''), 
		       COALESCE(a.content, ''), a.summary, COALESCE(a.category, ''), 
		       s.name as source, a.published_at
		FROM articles a
		JOIN article_clusters ac ON a.id = ac.article_id
		JOIN sources s ON s.id = a.source_id
		WHERE ac.cluster_id = $1
		ORDER BY a.published_at DESC`

	rows, err := config.DB.Query(context.Background(), query, clusterID)
	if err != nil {
		return c, nil, err
	}
	defer rows.Close()

	var articles []models.ArticleDB
	for rows.Next() {
		var a models.ArticleDB
		err := rows.Scan(&a.ID, &a.ExternalID, &a.Title, &a.URL, &a.Author,
			&a.Content, &a.Summary, &a.Category, &a.Source, &a.PublishedAt)
		if err != nil {
			return c, nil, err
		}
		articles = append(articles, a)
	}

	return c, articles, nil
}
