package repository

import (
	"context"

	"gateway/internal/config"
	"gateway/internal/models"
)

func GetVideos(page, perPage int) ([]models.VideoDB, int, error) {
	if page == 0 {
		page = 1
	}
	if perPage == 0 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	var total int
	err := config.DB.QueryRow(
		context.Background(),
		`SELECT COUNT(*) FROM videos
		WHERE published_at >= NOW() - INTERVAL '7 days'`,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := config.DB.Query(
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

	var videos []models.VideoDB
	for rows.Next() {
		var v models.VideoDB
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
