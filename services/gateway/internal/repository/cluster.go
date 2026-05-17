package repository

import (
	"context"
	"gateway/internal/config"
	"gateway/internal/models"
	"time"
)

func GetRecentClusters() ([]models.ClusterDB, map[string][]models.SourceDTO, error) {
	query := `
		SELECT
			c.id,
			c.label,
			COALESCE(c.description, '') as description,
			c.created_at,
			COUNT(ac.article_id) OVER (PARTITION BY c.id) as article_count,
			s.name,
			regexp_replace(a.url, '^https?://(?:www\.)?([^/]+).*', '\1') as article_domain
		FROM clusters c
		LEFT JOIN article_clusters ac ON ac.cluster_id = c.id
		LEFT JOIN articles a ON a.id = ac.article_id
		LEFT JOIN sources s ON s.id = a.source_id
		WHERE s.name IS NOT NULL
		AND c.created_at >= NOW() - INTERVAL '48 hours'
		ORDER BY c.created_at DESC, s.name`

	rows, err := config.DB.Query(context.Background(), query)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	clusterOrder := []string{}
	clustersMap := map[string]models.ClusterDB{}
	sourcesMap := map[string][]models.SourceDTO{}
	seenSources := map[string]map[string]bool{}

	for rows.Next() {
		var clusterID, label, description, name, articleDomain string
		var createdAt time.Time
		var articleCount int

		if err := rows.Scan(&clusterID, &label, &description, &createdAt, &articleCount, &name, &articleDomain); err != nil {
			return nil, nil, err
		}

		if _, exists := clustersMap[clusterID]; !exists {
			clustersMap[clusterID] = models.ClusterDB{
				ID:           clusterID,
				Label:        label,
				Description:  description,
				CreatedAt:    createdAt,
				ArticleCount: articleCount,
			}
			clusterOrder = append(clusterOrder, clusterID)
			seenSources[clusterID] = map[string]bool{}
		}

		if !seenSources[clusterID][articleDomain] {
			seenSources[clusterID][articleDomain] = true
			sourcesMap[clusterID] = append(sourcesMap[clusterID], models.SourceDTO{
				Name:    name,
				BaseUrl: articleDomain,
			})
		}
	}

	var clusters []models.ClusterDB
	for _, id := range clusterOrder {
		clusters = append(clusters, clustersMap[id])
	}

	return clusters, sourcesMap, nil
}

func GetClusterWithArticles(clusterID string) (models.ClusterDB, []models.SourceDTO, []models.ArticleDB, error) {
	var c models.ClusterDB
	seenSrc := map[string]bool{}
	var sources []models.SourceDTO

	sourceRows, err := config.DB.Query(context.Background(), `
		SELECT
			c.id, c.label, COALESCE(c.description, '') as description, c.created_at, -- ◄─── Ajout description
			COUNT(ac.article_id) OVER (PARTITION BY c.id) as article_count,
			s.name,
			regexp_replace(a.url, '^https?://(?:www\.)?([^/]+).*', '\1') as article_domain
		FROM clusters c
		LEFT JOIN article_clusters ac ON ac.cluster_id = c.id
		LEFT JOIN articles a ON a.id = ac.article_id
		LEFT JOIN sources s ON s.id = a.source_id
		WHERE c.id = $1
		AND s.name IS NOT NULL
		ORDER BY s.name`, clusterID)
	if err != nil {
		return c, nil, nil, err
	}
	defer sourceRows.Close()

	for sourceRows.Next() {
		var name, articleDomain string
		var articleCount int
		var createdAt time.Time

		if err := sourceRows.Scan(&c.ID, &c.Label, &c.Description, &createdAt, &articleCount, &name, &articleDomain); err != nil {
			return c, nil, nil, err
		}
		c.CreatedAt = createdAt
		c.ArticleCount = articleCount

		if !seenSrc[articleDomain] {
			seenSrc[articleDomain] = true
			sources = append(sources, models.SourceDTO{
				Name:    name,
				BaseUrl: articleDomain,
			})
		}
	}

	articleRows, err := config.DB.Query(context.Background(), `
		SELECT a.id, a.external_id, a.title, a.url, COALESCE(a.author, ''),
		       COALESCE(a.content, ''), a.summary, COALESCE(a.category, ''),
		       s.name as source, a.published_at
		FROM articles a
		JOIN article_clusters ac ON a.id = ac.article_id
		JOIN sources s ON s.id = a.source_id
		WHERE ac.cluster_id = $1
		ORDER BY a.published_at DESC`, clusterID)
	if err != nil {
		return c, sources, nil, err
	}
	defer articleRows.Close()

	var articles []models.ArticleDB
	for articleRows.Next() {
		var a models.ArticleDB
		if err := articleRows.Scan(
			&a.ID, &a.ExternalID, &a.Title, &a.URL, &a.Author,
			&a.Content, &a.Summary, &a.Category, &a.Source, &a.PublishedAt,
		); err != nil {
			return c, sources, nil, err
		}
		articles = append(articles, a)
	}

	return c, sources, articles, nil
}
