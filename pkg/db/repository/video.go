package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
)

func FilterNewVideos(conn *db.PostgresConnection, videos []coredata.VideoDB) ([]coredata.VideoDB, error) {
	if len(videos) == 0 {
		return nil, nil
	}

	ids := make([]string, len(videos))
	for i, v := range videos {
		ids[i] = v.ExternalID
	}

	rows, err := conn.Pool.Query(
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

	var newVideos []coredata.VideoDB
	for _, v := range videos {
		if !existing[v.ExternalID] {
			newVideos = append(newVideos, v)
		}
	}

	return newVideos, nil
}

func InsertVideos(conn *db.PostgresConnection, videos []coredata.VideoDB) error {
	if len(videos) == 0 {
		return nil
	}

	tx, err := conn.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for _, v := range videos {
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
			v.ExternalID, v.ChannelTitle,
		)
		if err != nil {
			return err
		}

		_, err = tx.Exec(
			context.Background(),
			`INSERT INTO feed_items (type, ref_id, published_at)
			VALUES ('video', $1, $2)
			ON CONFLICT (type, ref_id) DO NOTHING`,
			videoID, v.PublishedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}

func GetVideos(conn *db.PostgresConnection, page, perPage int) ([]coredata.VideoDB, int, error) {
	if page == 0 {
		page = 1
	}
	if perPage == 0 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	var total int
	err := conn.Pool.QueryRow(
		context.Background(),
		`SELECT COUNT(*) FROM videos
		WHERE published_at >= NOW() - INTERVAL '7 days'`,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := conn.Pool.Query(
		context.Background(),
		`SELECT
			id, external_id, title,
			COALESCE(description, ''),
			COALESCE(channel_title, ''),
			COALESCE(channel_avatar, ''),
			COALESCE(thumbnail, ''),
			published_at
		FROM videos
		WHERE published_at >= NOW() - INTERVAL '7 days'
		ORDER BY published_at DESC
		LIMIT $1 OFFSET $2`,
		perPage, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var videos []coredata.VideoDB
	for rows.Next() {
		var v coredata.VideoDB
		err := rows.Scan(
			&v.ID, &v.ExternalID, &v.Title,
			&v.Description, &v.ChannelTitle,
			&v.ChannelAvatar, &v.Thumbnail, &v.PublishedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		videos = append(videos, v)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return videos, total, nil
}

func GetVideosFeedByIDs(conn *db.PostgresConnection, ids []string) (map[string]coredata.VideoDB, error) {
	if len(ids) == 0 {
		return map[string]coredata.VideoDB{}, nil
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

	rows, err := conn.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("videos by ids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]coredata.VideoDB, len(ids))
	for rows.Next() {
		var v coredata.VideoDB
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
