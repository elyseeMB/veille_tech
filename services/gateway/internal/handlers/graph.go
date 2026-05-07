package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"gateway/internal/repository"

	"github.com/gin-gonic/gin"
)

func GetGraph() gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		if date == "" {
			date = time.Now().Format("2006-01-02")
		}

		graph, err := repository.GetGraph(date)
		if err != nil {
			slog.Error("get graph failed", "date", date, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		slog.Info("graph fetched", "date", date, "nodes", len(graph.Nodes), "edges", len(graph.Edges))

		c.JSON(http.StatusOK, graph)
	}
}
