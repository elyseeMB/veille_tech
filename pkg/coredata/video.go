package coredata

import (
	"net/url"
	"strings"
	"time"
)

type VideoDB struct {
	ID            string
	ExternalID    string
	Title         string
	Description   string
	ChannelTitle  string
	ChannelAvatar string
	Thumbnail     string
	Keywords      []string
	PublishedAt   time.Time
}

type VideoDTO struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	ChannelTitle  string   `json:"channelTitle"`
	ChannelAvatar string   `json:"channelAvatar"`
	Thumbnail     string   `json:"thumbnail"`
	Keywords      []string `json:"keywords"`
	PublishedAt   string   `json:"publishedAt"`
}

type VideosResponse struct {
	Videos  []VideoDTO `json:"videos"`
	Total   int        `json:"total"`
	Page    int        `json:"page"`
	PerPage int        `json:"per_page"`
}

type VideosCarouselResponse struct {
	Groups  []VideoCarouselGroup `json:"groups"`
	Total   int                  `json:"total"`
	Page    int                  `json:"page"`
	PerPage int                  `json:"per_page"`
}

type VideoCarouselGroup struct {
	PubDate string     `json:"pubDate"`
	Items   []VideoDTO `json:"items"`
}

func ChunkVideosIntoCarousel(dtos []VideoDTO, groupSize int) []VideoCarouselGroup {
	if groupSize <= 0 {
		groupSize = 5
	}

	groups := make([]VideoCarouselGroup, 0, (len(dtos)+groupSize-1)/groupSize)

	for i := 0; i < len(dtos); i += groupSize {
		end := i + groupSize
		if end > len(dtos) {
			end = len(dtos)
		}
		chunk := dtos[i:end]

		groups = append(groups, VideoCarouselGroup{
			PubDate: chunk[0].PublishedAt,
			Items:   chunk,
		})
	}

	return groups
}

func ToVideoDTO(v VideoDB) VideoDTO {
	avatar := v.ChannelAvatar
	if strings.HasPrefix(avatar, "http") {
		avatar = "/v1/avatar?url=" + url.QueryEscape(avatar)
	}

	return VideoDTO{
		ID:            v.ID,
		Title:         v.Title,
		Description:   v.Description,
		ChannelTitle:  v.ChannelTitle,
		ChannelAvatar: avatar,
		Thumbnail:     v.Thumbnail,
		Keywords:      v.Keywords,
		PublishedAt:   v.PublishedAt.Format(time.RFC3339),
	}
}
