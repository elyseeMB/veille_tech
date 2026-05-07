package repository

import (
	"context"
	"time"

	"fetcher/internal/config"
	"fetcher/internal/models"
)

func FilterNewVideos(videos []models.Video) ([]models.Video, error) {
	if len(videos) == 0 {
		return nil, nil
	}

	ids := make([]string, len(videos))
	for i, v := range videos {
		ids[i] = v.ExternalID
	}

	rows, err := config.DB.Query(
		context.Background(),
		`SELECT external_id FROM sync_log WHERE external_id = ANY($1)`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	existing := make(map[string]bool)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		existing[id] = true
	}

	var newVideos []models.Video
	for _, v := range videos {
		if !existing[v.ExternalID] {
			newVideos = append(newVideos, v)
		}
	}

	return newVideos, nil
}

func InsertVideos(videos []models.Video) error {
	if len(videos) == 0 {
		return nil
	}

	tx, err := config.DB.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for _, v := range videos {
		// Insert vidéo — RETURNING id pour le sync feed_items
		var videoID string
		err := tx.QueryRow(
			context.Background(),
			`INSERT INTO videos
				(external_id, source_id, title, description, channel_title, channel_avatar, thumbnail, published_at)
			VALUES ($1, (SELECT id FROM sources WHERE name = $2), $3, $4, $5, $6, $7, $8::timestamptz)
			ON CONFLICT (external_id) DO UPDATE SET external_id = EXCLUDED.external_id
			RETURNING id`,
			v.ExternalID, v.ChannelTitle, v.Title, v.Description,
			v.ChannelTitle, v.ChannelAvatar, v.Thumbnail, v.PublishedAt,
		).Scan(&videoID)
		if err != nil {
			return err
		}

		_, err = tx.Exec(
			context.Background(),
			`INSERT INTO sync_log (external_id, source_id)
			VALUES ($1, (SELECT id FROM sources WHERE name = $2))
			ON CONFLICT (external_id, source_id) DO NOTHING`,
			v.ExternalID,
			v.ChannelTitle,
		)
		if err != nil {
			return err
		}

		pubDate, err := time.Parse(time.RFC3339, v.PublishedAt)
		if err != nil {
			pubDate = time.Now()
		}

		_, err = tx.Exec(
			context.Background(),
			`INSERT INTO feed_items (type, ref_id, published_at)
			VALUES ('video', $1, $2)
			ON CONFLICT (type, ref_id) DO NOTHING`,
			videoID, pubDate,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}
