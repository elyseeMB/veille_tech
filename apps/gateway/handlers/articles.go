package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"gateway/models"
	"gateway/repository"

	"github.com/gin-gonic/gin"
)

func GetArticles() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

		filter := repository.ArticleFilter{
			Source:   c.Query("source"),
			Category: c.Query("category"),
			Date:     c.Query("date"),
			Page:     page,
			PerPage:  perPage,
		}

		articlesDB, total, err := repository.GetArticles(filter)
		if err != nil {
			slog.Error("get articles failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		dtos := make([]models.ArticleDTO, len(articlesDB))
		for i, a := range articlesDB {
			dtos[i] = models.ToArticleDTO(a)
		}

		slog.Info("articles fetched", "count", len(dtos), "total", total, "page", page)

		c.JSON(http.StatusOK, models.ArticlesResponse{
			Articles: dtos,
			Total:    total,
			Page:     page,
			PerPage:  perPage,
		})
	}
}

func GetArticleByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		articleDB, err := repository.GetArticleByID(id)
		if err != nil {
			slog.Warn("article not found", "id", id, "error", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
			return
		}

		c.JSON(http.StatusOK, models.ToArticleDTO(*articleDB))
	}
}
