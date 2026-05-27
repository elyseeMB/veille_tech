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

func GetArticles(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

		filter := coredata.ArticleFilter{
			Source:   c.Query("source"),
			Category: c.Query("category"),
			Date:     c.Query("date"),
			Page:     page,
			PerPage:  perPage,
		}

		articlesDB, total, err := repository.GetArticles(conn, filter)
		if err != nil {
			slog.Error("get articles failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		dtos := make([]coredata.ArticleDTO, len(articlesDB))
		for i, a := range articlesDB {
			dtos[i] = coredata.ToArticleDTO(a)
		}

		c.JSON(http.StatusOK, coredata.ArticlesResponse{
			Articles: dtos,
			Total:    total,
			Page:     page,
			PerPage:  perPage,
		})
	}
}

func GetArticleByID(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		articleDB, err := repository.GetArticleByID(conn, id)
		if err != nil {
			slog.Warn("article not found", "id", id, "error", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
			return
		}

		c.JSON(http.StatusOK, coredata.ToArticleDTO(*articleDB))
	}
}
