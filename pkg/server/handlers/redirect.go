package handlers

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/db"
)

func RedirectArticle(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var url string
		err := conn.Pool.QueryRow(
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
