package repository

import (
	"context"
	"time"

	"fetcher/config"
	"fetcher/models"

	"github.com/jackc/pgx/v5"
)

func FilterNew(articles []models.Article) ([]models.Article, error) {
	if len(articles) == 0 {
		return articles, nil
	}

	ids := make([]string, len(articles))
	for i, a := range articles {
		ids[i] = a.ID
	}

	rows, err := config.DB.Query(
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

	var newArticles []models.Article
	for _, a := range articles {
		if !existing[a.ID] {
			newArticles = append(newArticles, a)
		}
	}

	return newArticles, nil
}

func InsertArticles(articles []models.Article) error {
	if len(articles) == 0 {
		return nil
	}

	tx, err := config.DB.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for _, a := range articles {
		pubDate, err := parseDate(a.PubDate)
		if err != nil {
			pubDate = time.Now()
		}

		// Insert article — RETURNING id pour le sync feed_items
		var articleID string
		err = tx.QueryRow(
			context.Background(),
			`INSERT INTO articles (external_id, source_id, title, url, author, content, category, published_at)
			VALUES($1, (SELECT id FROM sources WHERE name = $2 AND active = true), $3, $4, $5, $6, $7, $8)
			ON CONFLICT (url) DO NOTHING
			RETURNING id`,
			a.ID, a.Source, a.Title, a.Link, a.Author, a.Content, a.Category, pubDate,
		).Scan(&articleID)
		if err != nil && err != pgx.ErrNoRows {
			return err
		}

		// sync_log — inchangé
		_, err = tx.Exec(
			context.Background(),
			`INSERT INTO sync_log (external_id, source_id)
			VALUES ($1, (SELECT id FROM sources WHERE name = $2 AND active = true))
			ON CONFLICT (external_id, source_id) DO NOTHING`,
			a.ID, a.Source,
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
				articleID, pubDate,
			)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit(context.Background())
}

func parseDate(raw string) (time.Time, error) {
	formats := []string{
		time.RFC1123Z,
		time.RFC1123,
		time.RFC3339,
	}
	for _, format := range formats {
		if t, err := time.Parse(format, raw); err == nil {
			return t, nil
		}
	}
	return time.Time{}, nil
}
