package main

import (
	"log/slog"
	"net/http"
	"os"

	"fetcher/config"
	"fetcher/handlers"
	"fetcher/repository"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	config.InitLogger()

	config.InitDB()
	defer config.DB.Close()

	if err := repository.SeedSources(); err != nil {
		slog.Error("failed to seed sources", "error", err)
		os.Exit(1)
	}
	slog.Info("sources seeded")

	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.GET("/rss", handlers.GetRSS())

	slog.Info("server starting", "port", "8080")
	r.Run()
}
