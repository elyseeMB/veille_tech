package repository

import (
	"context"
	"fmt"

	"gateway/config"
	"gateway/models"
)

type ArticleFilter struct {
	Source   string
	Category string
	Date     string
	Page     int
	PerPage  int
}

func GetArticles(f ArticleFilter) ([]models.ArticleDB, int, error) {
	if f.Page == 0 {
		f.Page = 1
	}
	if f.PerPage == 0 {
		f.PerPage = 20
	}
	offset := (f.Page - 1) * f.PerPage

	var where string
	args := []any{}
	argIdx := 1

	if f.Date != "" {
		where = fmt.Sprintf("WHERE a.published_at::date = $%d", argIdx)
		args = append(args, f.Date)
		argIdx++
	} else {
		where = "WHERE a.published_at >= NOW() - INTERVAL '24 hours'"
	}

	if f.Source != "" {
		where += fmt.Sprintf(" AND s.name = $%d", argIdx)
		args = append(args, f.Source)
		argIdx++
	}

	if f.Category != "" {
		where += fmt.Sprintf(" AND a.category = $%d", argIdx)
		args = append(args, f.Category)
		argIdx++
	}

	var total int
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM articles a
		JOIN sources s ON s.id = a.source_id
		%s`, where)

	err := config.DB.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	args = append(args, f.PerPage, offset)
	query := fmt.Sprintf(`
		SELECT
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
		%s
		ORDER BY a.published_at DESC
		LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)

	rows, err := config.DB.Query(context.Background(), query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var articles []models.ArticleDB
	for rows.Next() {
		var a models.ArticleDB
		err := rows.Scan(
			&a.ID, &a.ExternalID, &a.Title, &a.URL,
			&a.Author, &a.Content, &a.Summary,
			&a.Category, &a.Source, &a.PublishedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		articles = append(articles, a)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func GetArticleByID(id string) (*models.ArticleDB, error) {
	var a models.ArticleDB
	err := config.DB.QueryRow(
		context.Background(),
		`SELECT
			a.id, a.external_id, a.title, a.url,
			COALESCE(a.author, ''), COALESCE(a.content, ''),
			a.summary, COALESCE(a.category, ''),
			s.name AS source, a.published_at
		FROM articles a
		JOIN sources s ON s.id = a.source_id AND active = true
		WHERE a.id = $1`,
		id,
	).Scan(
		&a.ID, &a.ExternalID, &a.Title, &a.URL,
		&a.Author, &a.Content, &a.Summary,
		&a.Category, &a.Source, &a.PublishedAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}
