package v1

import (
	"log/slog"
	"net/http"
	"sort"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
)

func GetFeed(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
		videoFormat := c.DefaultQuery("video_format", "list")

		feedRows, total, err := repository.GetFeedItems(conn, coredata.FeedFilter{
			Page: page, PerPage: perPage,
		})
		if err != nil {
			slog.Error("get feed items failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		articleIDs, videoIDs := splitIDsByType(feedRows)

		articlesMap, err := repository.GetArticlesFeedByIDs(conn, articleIDs)
		if err != nil {
			slog.Error("get articles by ids failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		videosMap, err := repository.GetVideosFeedByIDs(conn, videoIDs)
		if err != nil {
			slog.Error("get videos by ids failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		items := hydrateFeed(feedRows, articlesMap, videosMap, videoFormat)

		c.JSON(http.StatusOK, coredata.FeedResponse{
			Items: items, Total: total, Page: page, PerPage: perPage,
		})
	}
}

func splitIDsByType(rows []coredata.FeedItemRow) (articleIDs, videoIDs []string) {
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
	rows []coredata.FeedItemRow,
	articlesMap map[string]coredata.ArticleDB,
	videosMap map[string]coredata.VideoDB,
	videoFormat string,
) []coredata.FeedItem {
	if videoFormat == "carousel" {
		return hydrateFeedCarousel(rows, articlesMap, videosMap)
	}

	items := make([]coredata.FeedItem, 0, len(rows))
	for _, r := range rows {
		switch r.Type {
		case "article":
			a, ok := articlesMap[r.RefID]
			if !ok {
				continue
			}
			dto := coredata.ToArticleDTO(a)
			items = append(items, coredata.FeedItem{Type: "article", Date: dto.PubDate, Data: dto})
		case "video":
			v, ok := videosMap[r.RefID]
			if !ok {
				continue
			}
			dto := coredata.ToVideoDTO(v)
			items = append(items, coredata.FeedItem{Type: "video", Date: dto.PublishedAt, Data: dto})
		}
	}
	return items
}

func hydrateFeedCarousel(
	rows []coredata.FeedItemRow,
	articlesMap map[string]coredata.ArticleDB,
	videosMap map[string]coredata.VideoDB,
) []coredata.FeedItem {
	var articleItems []coredata.FeedItem
	var videoDTOs []coredata.VideoDTO

	for _, r := range rows {
		switch r.Type {
		case "article":
			a, ok := articlesMap[r.RefID]
			if !ok {
				continue
			}
			dto := coredata.ToArticleDTO(a)
			articleItems = append(articleItems, coredata.FeedItem{Type: "article", Date: dto.PubDate, Data: dto})
		case "video":
			v, ok := videosMap[r.RefID]
			if !ok {
				continue
			}
			videoDTOs = append(videoDTOs, coredata.ToVideoDTO(v))
		}
	}

	groups := coredata.ChunkVideosIntoCarousel(videoDTOs, 5)
	carouselItems := make([]coredata.FeedItem, len(groups))
	for i, g := range groups {
		carouselItems[i] = coredata.FeedItem{Type: "video_carousel", Date: g.PubDate, Data: g}
	}

	all := append(articleItems, carouselItems...)
	sort.Slice(all, func(i, j int) bool { return all[i].Date > all[j].Date })
	return all
}
