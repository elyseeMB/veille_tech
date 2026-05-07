package repository

import (
	"context"

	"fetcher/internal/config"
	"fetcher/internal/data"
)

// SeedSources insère toutes les sources et leurs catégories en DB
// ON CONFLICT DO NOTHING = safe à appeler à chaque démarrage
// Si la source existe déjà → skip, pas d'erreur
func SeedSources() error {
	tx, err := config.DB.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for _, feed := range data.RSS_FEEDS {

		// INSERT source
		// ON CONFLICT (name) DO NOTHING = si "Wired" existe déjà → skip
		var sourceID string
		err := tx.QueryRow(
			context.Background(),
			`INSERT INTO sources (name, type)
			VALUES ($1, 'rss')
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id`,
			feed.Name,
		).Scan(&sourceID)
		if err != nil {
			return err
		}

		// INSERT catégories de cette source
		for _, cat := range feed.Categories {
			_, err := tx.Exec(
				context.Background(),
				`INSERT INTO source_categories (source_id, category, feed_url)
				VALUES ($1, $2, $3)
				ON CONFLICT (source_id, category) DO NOTHING`,
				sourceID,
				cat.Category,
				cat.URL,
			)
			if err != nil {
				return err
			}
		}
	}

	for _, channel := range data.YOUTUBE_CHANNELS {
		_, err := tx.Exec(
			context.Background(),
			`INSERT INTO sources (name, base_url, type)
			VALUES ($1, $2, 'youtube')
			ON CONFLICT (name) DO NOTHING`,
			channel.Name,
			"https://www.youtube.com/channel/"+channel.ID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}
