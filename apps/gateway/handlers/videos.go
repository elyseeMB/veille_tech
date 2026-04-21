package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"gateway/models"
	"gateway/repository"

	"github.com/gin-gonic/gin"
)

func GetVideos() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

		videosDB, total, err := repository.GetVideos(page, perPage)
		if err != nil {
			slog.Error("get videos failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		dtos := make([]models.VideoDTO, len(videosDB))
		for i, v := range videosDB {
			dtos[i] = models.ToVideoDTO(v)
		}

		slog.Info("videos fetched", "count", len(dtos), "total", total)

		c.JSON(http.StatusOK, models.VideosResponse{
			Videos:  dtos,
			Total:   total,
			Page:    page,
			PerPage: perPage,
		})
	}
}
