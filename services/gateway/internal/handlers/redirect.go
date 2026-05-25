package handlers

import (
	"context"
	"log/slog"
	"net/http"

	"gateway/internal/config"
	"github.com/gin-gonic/gin"
)

func RedirectArticle() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var url string
		err := config.DB.QueryRow(
			context.Background(),
			"SELECT url FROM articles WHERE id = $1",
			id,
		).Scan(&url)

		if err != nil {
			slog.Warn("article not found for redirect", "id", id, "error", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
			return
		}

		c.Redirect(http.StatusFound, url)
	}
}
