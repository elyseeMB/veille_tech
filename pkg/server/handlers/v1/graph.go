package v1

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
)

func GetGraph(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		if date == "" {
			date = time.Now().Format("2006-01-02")
		}

		graph, err := repository.GetGraph(conn, date)
		if err != nil {
			slog.Error("get graph failed", "date", date, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		slog.Info("graph fetched", "date", date, "nodes", len(graph.Nodes), "edges", len(graph.Edges))
		c.JSON(http.StatusOK, graph)
	}
}
