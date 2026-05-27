package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
)

func FilterNewArticles(conn *db.PostgresConnection, articles []coredata.ArticleDB) ([]coredata.ArticleDB, error) {
	if len(articles) == 0 {
		return articles, nil
	}

	ids := make([]string, len(articles))
	for i, a := range articles {
		ids[i] = a.ExternalID
	}

	rows, err := conn.Pool.Query(
		context.Background(),
		`SELECT a.external_id
         FROM sync_log a
         JOIN sources s ON s.id = a.source_id
         WHERE a.external_id = ANY($1) OR s.active = false`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	existing := make(map[string]bool)
	for rows.Next() {
		var id string
		rows.Scan(&id)
		existing[id] = true
	}

	var newArticles []coredata.ArticleDB
	for _, a := range articles {
		if !existing[a.ExternalID] {
			newArticles = append(newArticles, a)
		}
	}

	return newArticles, nil
}

func InsertArticles(conn *db.PostgresConnection, articles []coredata.ArticleDB) error {
	if len(articles) == 0 {
		return nil
	}

	tx, err := conn.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for _, a := range articles {
		var articleID string
		err = tx.QueryRow(
			context.Background(),
			`INSERT INTO articles (external_id, source_id, title, url, author, content, category, published_at)
			VALUES($1, (SELECT id FROM sources WHERE name = $2 AND active = true), $3, $4, $5, $6, $7, $8)
			ON CONFLICT (url) DO NOTHING
			RETURNING id`,
			a.ExternalID, a.Source, a.Title, a.URL, a.Author, a.Content, a.Category, a.PublishedAt,
		).Scan(&articleID)
		if err != nil && err != pgx.ErrNoRows {
			return err
		}

		_, err = tx.Exec(
			context.Background(),
			`INSERT INTO sync_log (external_id, source_id)
			VALUES ($1, (SELECT id FROM sources WHERE name = $2 AND active = true))
			ON CONFLICT (external_id, source_id) DO NOTHING`,
			a.ExternalID, a.Source,
		)
		if err != nil {
			return err
		}

		if articleID != "" {
			_, err = tx.Exec(
				context.Background(),
				`INSERT INTO feed_items (type, ref_id, published_at)
				VALUES ('article', $1, $2)
				ON CONFLICT (type, ref_id) DO NOTHING`,
				articleID, a.PublishedAt,
			)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit(context.Background())
}

func UpdateSourceBaseURL(conn *db.PostgresConnection, name, baseURL string) error {
	_, err := conn.Pool.Exec(context.Background(),
		`UPDATE sources SET base_url = $1
		 WHERE name = $2 AND (base_url IS NULL OR base_url = '')`,
		baseURL, name,
	)
	return err
}

// ========================== API ==================================================

func GetArticles(conn *db.PostgresConnection, filter coredata.ArticleFilter) ([]coredata.ArticleDB, int, error) {
	if filter.Page == 0 {
		filter.Page = 1
	}
	if filter.PerPage == 0 {
		filter.PerPage = 20
	}
	offset := (filter.Page - 1) * filter.PerPage

	var where string
	args := []any{}
	argIdx := 1

	if filter.Date != "" {
		where = fmt.Sprintf("WHERE a.published_at::date = $%d", argIdx)
		args = append(args, filter.Date)
		argIdx++
	} else {
		where = "WHERE a.published_at >= NOW() - INTERVAL '24 hours'"
	}

	if filter.Source != "" {
		where += fmt.Sprintf(" AND s.name = $%d", argIdx)
		args = append(args, filter.Source)
		argIdx++
	}

	if filter.Category != "" {
		where += fmt.Sprintf(" AND a.category = $%d", argIdx)
		args = append(args, filter.Category)
		argIdx++
	}

	var total int
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM articles a
		JOIN sources s ON s.id = a.source_id
		%s`, where)

	err := conn.Pool.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	args = append(args, filter.PerPage, offset)
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
			COALESCE(a.keywords, '{}'),
			s.name AS source,
			a.published_at
		FROM articles a
		JOIN sources s ON s.id = a.source_id
		%s
		ORDER BY a.published_at DESC
		LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)

	rows, err := conn.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var articles []coredata.ArticleDB
	for rows.Next() {
		var a coredata.ArticleDB
		err := rows.Scan(
			&a.ID, &a.ExternalID, &a.Title, &a.URL,
			&a.Author, &a.Content, &a.Summary,
			&a.Category, &a.Keywords, &a.Source, &a.PublishedAt,
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

func GetArticleByID(conn *db.PostgresConnection, id string) (*coredata.ArticleDB, error) {
	var a coredata.ArticleDB
	err := conn.Pool.QueryRow(
		context.Background(),
		`SELECT
			a.id, a.external_id, a.title, a.url,
			COALESCE(a.author, ''), COALESCE(a.content, ''),
			a.summary, COALESCE(a.category, ''),
			COALESCE(a.keywords, '{}'),
			s.name AS source, a.published_at
		FROM articles a
		JOIN sources s ON s.id = a.source_id AND active = true
		WHERE a.id = $1`,
		id,
	).Scan(
		&a.ID, &a.ExternalID, &a.Title, &a.URL,
		&a.Author, &a.Content, &a.Summary,
		&a.Category, &a.Keywords,
		&a.Source, &a.PublishedAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func GetArticlesFeedByIDs(conn *db.PostgresConnection, ids []string) (map[string]coredata.ArticleDB, error) {
	if len(ids) == 0 {
		return map[string]coredata.ArticleDB{}, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(
		`SELECT
			a.id, a.external_id, a.title, a.url,
			COALESCE(a.author, ''),
			COALESCE(a.content, ''),
			a.summary,
			COALESCE(a.keywords, '{}'),
			COALESCE(a.category, ''),
			s.name AS source,
			a.published_at
		FROM articles a
		JOIN sources s ON s.id = a.source_id AND active = true
		WHERE a.id = ANY(ARRAY[%s]::uuid[])`,
		strings.Join(placeholders, ", "),
	)

	rows, err := conn.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("articles by ids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]coredata.ArticleDB, len(ids))
	for rows.Next() {
		var a coredata.ArticleDB
		if err := rows.Scan(
			&a.ID, &a.ExternalID, &a.Title, &a.URL,
			&a.Author, &a.Content, &a.Summary, &a.Keywords,
			&a.Category, &a.Source, &a.PublishedAt,
		); err != nil {
			return nil, fmt.Errorf("articles scan: %w", err)
		}
		result[a.ID] = a
	}

	return result, rows.Err()
}
