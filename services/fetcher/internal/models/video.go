package models

type Video struct {
	ExternalID    string `json:"externalId"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	ChannelTitle  string `json:"channelTitle"`
	ChannelAvatar string `json:"channelAvatar"`
	Thumbnail     string `json:"thumbnail"`
	PublishedAt   string `json:"publishedAt"`
}
