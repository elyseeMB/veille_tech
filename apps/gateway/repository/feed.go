package repository

import (
	"context"
	"fmt"
	"strings"

	"gateway/config"
	"gateway/models"
)

type FeedFilter struct {
	Page    int
	PerPage int
	Types   []string
}

func GetFeedItems(f FeedFilter) ([]models.FeedItemRow, int, error) {
	if f.Page == 0 {
		f.Page = 1
	}
	if f.PerPage == 0 {
		f.PerPage = 20
	}
	offset := (f.Page - 1) * f.PerPage

	whereClause := ""
	args := []interface{}{}

	whereClause = "WHERE published_at >= CURRENT_DATE - INTERVAL '1 day'"

	if len(f.Types) > 0 {
		placeholders := make([]string, len(f.Types))
		for i, t := range f.Types {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
			args = append(args, t)
		}
		whereClause += fmt.Sprintf(" AND type IN (%s)", strings.Join(placeholders, ", "))
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM feed_items %s", whereClause)
	err := config.DB.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("feed count: %w", err)
	}

	limitOffset := len(args)
	args = append(args, f.PerPage, offset)

	selectQuery := fmt.Sprintf(
		`SELECT id, type, ref_id, published_at
		 FROM feed_items
		 %s
		 ORDER BY published_at DESC
		 LIMIT $%d OFFSET $%d`,
		whereClause, limitOffset+1, limitOffset+2,
	)

	rows, err := config.DB.Query(context.Background(), selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("feed query: %w", err)
	}
	defer rows.Close()

	var result []models.FeedItemRow
	for rows.Next() {
		var r models.FeedItemRow
		if err := rows.Scan(&r.ID, &r.Type, &r.RefID, &r.PublishedAt); err != nil {
			return nil, 0, fmt.Errorf("feed scan: %w", err)
		}
		result = append(result, r)
	}

	return result, total, rows.Err()
}

func GetArticlesFeedByIDs(ids []string) (map[string]models.ArticleDB, error) {
	if len(ids) == 0 {
		return map[string]models.ArticleDB{}, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(
		`SELECT
			a.id,
			a.external_id,
			a.title,
			a.url,
			COALESCE(a.author, ''),
			COALESCE(a.content, ''),
			a.summary,
			COALESCE(a.category, ''),
			s.name AS source,
			a.published_at
		FROM articles a
		JOIN sources s ON s.id = a.source_id
		WHERE a.id = ANY(ARRAY[%s]::uuid[])`,
		strings.Join(placeholders, ", "),
	)

	rows, err := config.DB.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("articles by ids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]models.ArticleDB, len(ids))
	for rows.Next() {
		var a models.ArticleDB
		if err := rows.Scan(
			&a.ID, &a.ExternalID, &a.Title, &a.URL,
			&a.Author, &a.Content, &a.Summary,
			&a.Category, &a.Source, &a.PublishedAt,
		); err != nil {
			return nil, fmt.Errorf("articles scan: %w", err)
		}
		result[a.ID] = a
	}

	return result, rows.Err()
}

func GetVideosFeedByIDs(ids []string) (map[string]models.VideoDB, error) {
	if len(ids) == 0 {
		return map[string]models.VideoDB{}, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(
		`SELECT
			id, external_id, title,
			COALESCE(description, ''),
			COALESCE(channel_title, ''),
			COALESCE(channel_avatar, ''),
			COALESCE(thumbnail, ''),
			published_at
		FROM videos
		WHERE id = ANY(ARRAY[%s]::uuid[])`,
		strings.Join(placeholders, ", "),
	)

	rows, err := config.DB.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("videos by ids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]models.VideoDB, len(ids))
	for rows.Next() {
		var v models.VideoDB
		if err := rows.Scan(
			&v.ID, &v.ExternalID, &v.Title,
			&v.Description, &v.ChannelTitle,
			&v.ChannelAvatar, &v.Thumbnail, &v.PublishedAt,
		); err != nil {
			return nil, fmt.Errorf("videos scan: %w", err)
		}
		result[v.ID] = v
	}

	return result, rows.Err()
}
