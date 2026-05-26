package repository

import (
	"context"
	"time"

	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
)

func GetRecentClusters(conn *db.PostgresConnection) ([]coredata.ClusterDB, map[string][]coredata.SourceDTO, error) {
	query := `SELECT
					c.id, c.label,
					COALESCE(c.description, '') as description,
					c.created_at,
					item_counts.item_count,
					item_counts.cluster_type,
					item_type,
					source_name,
					item_domain
				FROM clusters c
				JOIN (
					SELECT
						cluster_id, COUNT(*) as item_count,
						CASE
							WHEN COUNT(*) FILTER (WHERE type = 'article') > 0
							AND COUNT(*) FILTER (WHERE type = 'video') > 0 THEN 'mixed'
							WHEN COUNT(*) FILTER (WHERE type = 'video') > 0 THEN 'video'
							ELSE 'article'
						END as cluster_type
					FROM cluster_items
					GROUP BY cluster_id
				) item_counts ON item_counts.cluster_id = c.id
				JOIN (
					SELECT ci.cluster_id, ci.type as item_type, s.name as source_name,
						regexp_replace(a.url, '^https?://(?:www\.)?([^/]+).*', '\1') as item_domain
					FROM cluster_items ci
					JOIN articles a ON a.id = ci.ref_id AND ci.type = 'article'
					JOIN sources s ON s.id = a.source_id
					UNION ALL
					SELECT ci.cluster_id, ci.type as item_type, s.name as source_name,
						v.external_id as item_domain
					FROM cluster_items ci
					JOIN videos v ON v.id = ci.ref_id AND ci.type = 'video'
					JOIN sources s ON s.id = v.source_id
				) items ON items.cluster_id = c.id
				WHERE c.created_at >= NOW() - INTERVAL '3 days'
				ORDER BY c.created_at DESC`

	rows, err := conn.Pool.Query(context.Background(), query)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	clusterOrder := []string{}
	clustersMap := map[string]coredata.ClusterDB{}
	sourcesMap := map[string][]coredata.SourceDTO{}
	seenSources := map[string]map[string]bool{}

	for rows.Next() {
		var clusterID, label, description, clusterType, itemType, sourceName, itemDomain string
		var createdAt time.Time
		var itemCount int

		if err := rows.Scan(
			&clusterID, &label, &description,
			&createdAt, &itemCount, &clusterType, &itemType,
			&sourceName, &itemDomain,
		); err != nil {
			return nil, nil, err
		}

		if _, exists := clustersMap[clusterID]; !exists {
			clustersMap[clusterID] = coredata.ClusterDB{
				ID: clusterID, Label: label, Description: description,
				CreatedAt: createdAt, ArticleCount: itemCount, Type: clusterType,
			}
			clusterOrder = append(clusterOrder, clusterID)
			seenSources[clusterID] = map[string]bool{}
		}

		if !seenSources[clusterID][itemDomain] {
			seenSources[clusterID][itemDomain] = true
			sourcesMap[clusterID] = append(sourcesMap[clusterID], coredata.SourceDTO{
				Name: sourceName, BaseUrl: itemDomain, Type: itemType,
			})
		}
	}

	var clusters []coredata.ClusterDB
	for _, id := range clusterOrder {
		clusters = append(clusters, clustersMap[id])
	}

	return clusters, sourcesMap, nil
}

func GetClusterWithItems(conn *db.PostgresConnection, clusterID string) (coredata.ClusterDB, []coredata.SourceDTO, []coredata.ArticleDB, []coredata.VideoDB, error) {
	var c coredata.ClusterDB
	seenSrc := map[string]bool{}
	var sources []coredata.SourceDTO
	var articles []coredata.ArticleDB
	var videos []coredata.VideoDB

	sourceRows, err := conn.Pool.Query(context.Background(), `SELECT
			c.id, c.label, COALESCE(c.description, '') as description, c.created_at,
			COUNT(*) OVER (PARTITION BY c.id) as item_count,
			item_counts.cluster_type, item_type, source_name, item_domain
		FROM clusters c
		JOIN (
			SELECT cluster_id,
				CASE
					WHEN COUNT(*) FILTER (WHERE type = 'article') > 0
					AND COUNT(*) FILTER (WHERE type = 'video') > 0 THEN 'mixed'
					WHEN COUNT(*) FILTER (WHERE type = 'video') > 0 THEN 'video'
					ELSE 'article'
				END as cluster_type
			FROM cluster_items GROUP BY cluster_id
		) item_counts ON item_counts.cluster_id = c.id
		JOIN (
			SELECT ci.cluster_id, ci.type as item_type, s.name as source_name,
				regexp_replace(a.url, '^https?://(?:www\.)?([^/]+).*', '\1') as item_domain
			FROM cluster_items ci
			JOIN articles a ON a.id = ci.ref_id AND ci.type = 'article'
			JOIN sources s ON s.id = a.source_id
			UNION ALL
			SELECT ci.cluster_id, ci.type as item_type, s.name as source_name,
				v.external_id as item_domain
			FROM cluster_items ci
			JOIN videos v ON v.id = ci.ref_id AND ci.type = 'video'
			JOIN sources s ON s.id = v.source_id
		) items ON items.cluster_id = c.id
		WHERE c.id = $1
		ORDER BY source_name`, clusterID)
	if err != nil {
		return c, nil, nil, nil, err
	}
	defer sourceRows.Close()

	for sourceRows.Next() {
		var sourceName, itemDomain, itemType, clusterType string
		var itemCount int
		var createdAt time.Time

		if err := sourceRows.Scan(&c.ID, &c.Label, &c.Description, &createdAt, &itemCount, &clusterType, &itemType, &sourceName, &itemDomain); err != nil {
			return c, nil, nil, nil, err
		}
		c.CreatedAt = createdAt
		c.ArticleCount = itemCount
		c.Type = clusterType

		if !seenSrc[itemDomain] {
			seenSrc[itemDomain] = true
			sources = append(sources, coredata.SourceDTO{
				Name: sourceName, BaseUrl: itemDomain, Type: itemType,
			})
		}
	}

	itemRows, err := conn.Pool.Query(context.Background(), `
		SELECT ref_id, type FROM cluster_items WHERE cluster_id = $1`, clusterID)
	if err != nil {
		return c, sources, nil, nil, err
	}
	defer itemRows.Close()

	var articleIDs []string
	var videoIDs []string

	for itemRows.Next() {
		var refID, itemType string
		if err := itemRows.Scan(&refID, &itemType); err != nil {
			return c, sources, nil, nil, err
		}
		switch itemType {
		case "article":
			articleIDs = append(articleIDs, refID)
		case "video":
			videoIDs = append(videoIDs, refID)
		}
	}

	if len(articleIDs) > 0 {
		articlesMap, err := GetArticlesFeedByIDs(conn, articleIDs)
		if err != nil {
			return c, sources, nil, nil, err
		}
		for _, id := range articleIDs {
			if article, exists := articlesMap[id]; exists {
				articles = append(articles, article)
			}
		}
	} else {
		articles = []coredata.ArticleDB{}
	}

	if len(videoIDs) > 0 {
		videosMap, err := GetVideosFeedByIDs(conn, videoIDs)
		if err != nil {
			return c, sources, articles, nil, err
		}
		for _, id := range videoIDs {
			if video, exists := videosMap[id]; exists {
				videos = append(videos, video)
			}
		}
	} else {
		videos = []coredata.VideoDB{}
	}

	return c, sources, articles, videos, nil
}
