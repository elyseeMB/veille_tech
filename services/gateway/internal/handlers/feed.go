package handlers

import (
	"log/slog"
	"net/http"
	"sort"
	"strconv"

	"gateway/internal/models"
	"gateway/internal/repository"

	"github.com/gin-gonic/gin"
)

func GetFeed() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
		videoFormat := c.DefaultQuery("video_format", "list")

		feedRows, total, err := repository.GetFeedItems(repository.FeedFilter{
			Page:    page,
			PerPage: perPage,
		})
		if err != nil {
			slog.Error("get feed items failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		articleIDs, videoIDs := splitIDsByType(feedRows)

		articlesMap, err := repository.GetArticlesFeedByIDs(articleIDs)
		if err != nil {
			slog.Error("get articles by ids failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		videosMap, err := repository.GetVideosFeedByIDs(videoIDs)
		if err != nil {
			slog.Error("get videos by ids failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		items := hydrateFeed(feedRows, articlesMap, videosMap, videoFormat)

		slog.Info("feed fetched",
			"page", page,
			"per_page", perPage,
			"total", total,
			"returned", len(items),
		)

		c.JSON(http.StatusOK, models.FeedResponse{
			Items:   items,
			Total:   total,
			Page:    page,
			PerPage: perPage,
		})
	}
}

func splitIDsByType(rows []models.FeedItemRow) (articleIDs, videoIDs []string) {
	for _, r := range rows {
		switch r.Type {
		case "article":
			articleIDs = append(articleIDs, r.RefID)
		case "video":
			videoIDs = append(videoIDs, r.RefID)
		}
	}
	return
}

func hydrateFeed(
	rows []models.FeedItemRow,
	articlesMap map[string]models.ArticleDB,
	videosMap map[string]models.VideoDB,
	videoFormat string,
) []models.FeedItem {

	if videoFormat == "carousel" {
		return hydrateFeedCarousel(rows, articlesMap, videosMap)
	}

	items := make([]models.FeedItem, 0, len(rows))

	for _, r := range rows {
		switch r.Type {
		case "article":
			a, ok := articlesMap[r.RefID]
			if !ok {
				slog.Warn("article not found for feed row", "ref_id", r.RefID)
				continue
			}
			dto := models.ToArticleDTO(a)
			items = append(items, models.FeedItem{
				Type: "article",
				Date: dto.PubDate,
				Data: dto,
			})

		case "video":
			v, ok := videosMap[r.RefID]
			if !ok {
				slog.Warn("video not found for feed row", "ref_id", r.RefID)
				continue
			}
			dto := models.ToVideoDTO(v)
			items = append(items, models.FeedItem{
				Type: "video",
				Date: dto.PublishedAt,
				Data: dto,
			})
		}
	}

	return items
}

func hydrateFeedCarousel(
	rows []models.FeedItemRow,
	articlesMap map[string]models.ArticleDB,
	videosMap map[string]models.VideoDB,
) []models.FeedItem {

	var articleItems []models.FeedItem
	var videoDTOs []models.VideoDTO

	for _, r := range rows {
		switch r.Type {
		case "article":
			a, ok := articlesMap[r.RefID]
			if !ok {
				continue
			}
			dto := models.ToArticleDTO(a)
			articleItems = append(articleItems, models.FeedItem{
				Type: "article",
				Date: dto.PubDate,
				Data: dto,
			})

		case "video":
			v, ok := videosMap[r.RefID]
			if !ok {
				continue
			}
			videoDTOs = append(videoDTOs, models.ToVideoDTO(v))
		}
	}

	groups := models.ChunkVideosIntoCarousel(videoDTOs, 5)
	carouselItems := make([]models.FeedItem, len(groups))
	for i, g := range groups {
		carouselItems[i] = models.FeedItem{
			Type: "video_carousel",
			Date: g.PubDate,
			Data: g,
		}
	}

	all := append(articleItems, carouselItems...)
	sort.Slice(all, func(i, j int) bool {
		return all[i].Date > all[j].Date
	})

	return all
}
