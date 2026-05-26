package server

import (
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/cfg"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/server/handlers"
	v1handler "github.com/mbous/veille_tech/pkg/server/handlers/v1"
)

func cacheControl(value string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", value)
		c.Next()
	}
}

func NewRouter(conn *db.PostgresConnection, config *cfg.Config) *gin.Engine {
	r := gin.Default()

	allowOrigins := config.AllowedOrigins()

	if os.Getenv("AWS_LAMBDA_RUNTIME_API") == "" || os.Getenv("LOCAL_DEV") == "true" {
		allowOrigins = append(allowOrigins,
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowMethods: []string{"GET", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	r.OPTIONS("/*any", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.GET("/r/:id", handlers.RedirectArticle(conn))

	v1 := r.Group("/v1")
	{
		v1.GET("/feed", cacheControl("public, max-age=300, stale-while-revalidate=600"), v1handler.GetFeed(conn))
		v1.GET("/videos", cacheControl("public, max-age=1800"), v1handler.GetVideos(conn))
		v1.GET("/articles", cacheControl("public, max-age=1800"), v1handler.GetArticles(conn))
		v1.GET("/calendar", cacheControl("public, max-age=1800"), v1handler.GetCalendarMeta(conn))
		v1.GET("/graph", cacheControl("public, max-age=1800"), v1handler.GetGraph(conn))
		v1.GET("/clusters", cacheControl("public, max-age=1800"), v1handler.GetClusters(conn))
		v1.GET("/clusters/:id", cacheControl("public, max-age=1800"), v1handler.GetClusterByID(conn))
		v1.GET("/articles/:id", cacheControl("public, max-age=86400"), v1handler.GetArticleByID(conn))
		v1.GET("/avatar", cacheControl("public, max-age=86400"), handlers.ProxyAvatar())
		v1.GET("/favicon", cacheControl("public, max-age=86400"), handlers.ProxyFavicon())
	}

	return r
}
