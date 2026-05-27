package v1

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
)

func GetVideos(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
		format := c.DefaultQuery("format", "list")

		videosDB, total, err := repository.GetVideos(conn, page, perPage)
		if err != nil {
			slog.Error("get videos failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		dtos := make([]coredata.VideoDTO, len(videosDB))
		for i, v := range videosDB {
			dtos[i] = coredata.ToVideoDTO(v)
		}

		if format == "carousel" {
			groups := coredata.ChunkVideosIntoCarousel(dtos, 5)
			c.JSON(http.StatusOK, coredata.VideosCarouselResponse{
				Groups: groups, Total: total, Page: page, PerPage: perPage,
			})
			return
		}

		c.JSON(http.StatusOK, coredata.VideosResponse{
			Videos: dtos, Total: total, Page: page, PerPage: perPage,
		})
	}
}
