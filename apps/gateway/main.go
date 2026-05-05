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

func cacheControl(value string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", value)
		c.Next()
	}
}

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
		// Cache 30 min
		v1.GET("/calendar", cacheControl("public, max-age=1800"), handlers.GetCalendarMeta())
		v1.GET("/graph", cacheControl("public, max-age=1800"), handlers.GetGraph())
		v1.GET("/articles", cacheControl("public, max-age=1800"), handlers.GetArticles())

		// Cache 5 min
		v1.GET("/feed", cacheControl("public, max-age=300, stale-while-revalidate=900"), handlers.GetFeed())
		v1.GET("/videos", cacheControl("public, max-age=300, stale-while-revalidate=900"), handlers.GetVideos())

		// Cache 24h
		v1.GET("/articles/:id", cacheControl("public, max-age=86400"), handlers.GetArticleByID())
		v1.GET("/avatar", cacheControl("public, max-age=86400"), handlers.ProxyAvatar())
	}

	slog.Info("gateway starting", "port", "8081")
	r.Run(":8081")
}
