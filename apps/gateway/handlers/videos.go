package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gateway/models"
	"gateway/repository"
)

func GetVideos() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

		videos, total, err := repository.GetVideos(page, perPage)
		if err != nil {
			slog.Error("get videos failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if videos == nil {
			videos = []models.Video{}
		}

		slog.Info("videos fetched", "count", len(videos), "total", total, "page", page)

		c.JSON(http.StatusOK, models.PaginatedResponse{
			Data:    videos,
			Total:   total,
			Page:    page,
			PerPage: perPage,
		})
	}
}
