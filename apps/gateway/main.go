package main

import (
	"log/slog"
	"net/http"
	"os"

	"gateway/config"
	"gateway/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	config.Init()

	if os.Getenv("GIN_MODE") == "release" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	}

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	v1 := r.Group("/v1")
	{
		v1.GET("/articles", handlers.GetArticles())
		v1.GET("/articles/:id", handlers.GetArticleByID())
		v1.GET("/videos", handlers.GetVideos())
	}

	slog.Info("server starting", "port", "8081")
	r.Run(":8081")
}
