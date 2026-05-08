package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"sync"

	"fetcher/internal/data"
	"fetcher/internal/models"
	"fetcher/internal/repository"
)

type ytPlaylistResponse struct {
	Error *struct{ Message string } `json:"error"`
	Items []struct {
		Snippet struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			PublishedAt string `json:"publishedAt"`
			Thumbnails  struct {
				High   *struct{ URL string } `json:"high"`
				Medium *struct{ URL string } `json:"medium"`
			} `json:"thumbnails"`
			ResourceID struct {
				VideoID string `json:"videoId"`
			} `json:"resourceId"`
			ChannelTitle string `json:"channelTitle"`
		} `json:"snippet"`
	} `json:"items"`
}

type ytChannelResponse struct {
	Items []struct {
		Snippet struct {
			Thumbnails struct {
				High    *struct{ URL string } `json:"high"`
				Medium  *struct{ URL string } `json:"medium"`
				Default *struct{ URL string } `json:"default"`
			} `json:"thumbnails"`
		} `json:"snippet"`
	} `json:"items"`
}

func FetchYouTube(ctx context.Context) error {
	apiKey := os.Getenv("YOUTUBE_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("YOUTUBE_API_KEY not set")
	}

	type Result struct {
		videos []models.Video
		err    error
	}

	results := make(chan Result, len(data.YOUTUBE_CHANNELS))
	var wg sync.WaitGroup

	for _, channel := range data.YOUTUBE_CHANNELS {
		wg.Add(1)
		go func(ch data.YouTubeChannel) {
			defer wg.Done()

			playlistID := "UU" + ch.ID[2:]
			ytURL := fmt.Sprintf(
				"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=%s&maxResults=5&key=%s",
				playlistID, apiKey,
			)
			chURL := fmt.Sprintf(
				"https://www.googleapis.com/youtube/v3/channels?part=snippet&id=%s&key=%s",
				ch.ID, apiKey,
			)

			type apiResult struct {
				body []byte
				err  error
			}
			ytCh := make(chan apiResult, 1)
			chCh := make(chan apiResult, 1)

			go func() {
				b, err := fetchJSON(ytURL)
				ytCh <- apiResult{b, err}
			}()
			go func() {
				b, err := fetchJSON(chURL)
				chCh <- apiResult{b, err}
			}()

			ytRes := <-ytCh
			chRes := <-chCh

			if ytRes.err != nil {
				slog.Warn("youtube playlist fetch failed",
					"channel", ch.Name,
					"error", ytRes.err,
				)
				results <- Result{videos: nil}
				return
			}

			var playlist ytPlaylistResponse
			if err := json.Unmarshal(ytRes.body, &playlist); err != nil {
				results <- Result{err: err}
				return
			}
			if playlist.Error != nil {
				slog.Warn("youtube api error",
					"channel", ch.Name,
					"error", playlist.Error.Message,
				)
				results <- Result{videos: nil}
				return
			}

			avatar := ""
			if chRes.err == nil {
				var channelData ytChannelResponse
				if err := json.Unmarshal(chRes.body, &channelData); err == nil && len(channelData.Items) > 0 {
					t := channelData.Items[0].Snippet.Thumbnails
					switch {
					case t.High != nil:
						avatar = t.High.URL
					case t.Medium != nil:
						avatar = t.Medium.URL
					case t.Default != nil:
						avatar = t.Default.URL
					}
				}
			}

			var videos []models.Video
			for _, item := range playlist.Items {
				s := item.Snippet
				thumbnail := ""
				if s.Thumbnails.High != nil {
					thumbnail = s.Thumbnails.High.URL
				} else if s.Thumbnails.Medium != nil {
					thumbnail = s.Thumbnails.Medium.URL
				}

				videos = append(videos, models.Video{
					ExternalID:    s.ResourceID.VideoID,
					Title:         s.Title,
					Description:   s.Description,
					ChannelTitle:  ch.Name,
					ChannelAvatar: avatar,
					Thumbnail:     thumbnail,
					PublishedAt:   s.PublishedAt,
				})
			}

			slog.Debug("youtube channel fetched",
				"channel", ch.Name,
				"count", len(videos),
			)

			results <- Result{videos: videos}
		}(channel)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	var allVideos []models.Video
	for result := range results {
		if result.err != nil {
			return result.err
		}
		allVideos = append(allVideos, result.videos...)
	}

	seen := make(map[string]bool)
	var unique []models.Video
	for _, v := range allVideos {
		if !seen[v.ExternalID] {
			seen[v.ExternalID] = true
			unique = append(unique, v)
		}
	}

	newVideos, err := repository.FilterNewVideos(unique)
	if err != nil {
		return fmt.Errorf("filter new videos failed: %w", err)
	}

	if err := repository.InsertVideos(newVideos); err != nil {
		return fmt.Errorf("insert videos failed: %w", err)
	}

	slog.Info("youtube sync completed",
		"new", len(newVideos),
		"skipped", len(unique)-len(newVideos),
	)

	return nil
}

func fetchJSON(url string) ([]byte, error) {
	res, err := httpClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	return io.ReadAll(res.Body)
}
