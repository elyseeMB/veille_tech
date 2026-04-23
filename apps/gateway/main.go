package main

import (
	"log/slog"
	"net/http"

	"gateway/config"
	"gateway/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	config.InitLogger()
	config.Init()
	defer config.DB.Close()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	v1 := r.Group("/v1")
	{
		v1.GET("/calendar", handlers.GetCalendarMeta())
		v1.GET("/feed", handlers.GetFeed())
		v1.GET("/avatar", handlers.ProxyAvatar())
		v1.GET("/articles", handlers.GetArticles())
		v1.GET("/articles/:id", handlers.GetArticleByID())
		v1.GET("/videos", handlers.GetVideos())
		v1.GET("/graph", handlers.GetGraph())
	}

	slog.Info("gateway starting", "port", "8081")
	r.Run(":8081")
}
