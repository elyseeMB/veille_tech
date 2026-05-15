package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"gateway/internal/config"
	"gateway/internal/handlers"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var ginLambda *httpadapter.HandlerAdapterV2

func cacheControl(value string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", value)
		c.Next()
	}
}

func loadSecrets() {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") == "" {
		return
	}

	ctx := context.TODO()
	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		slog.Error("unable to load SDK config", "error", err)
		return
	}

	client := ssm.NewFromConfig(cfg)

	params := map[string]string{
		"DATABASE_URL": os.Getenv("DB_PARAM_NAME"),
	}

	for envKey, ssmPath := range params {
		out, err := client.GetParameter(ctx, &ssm.GetParameterInput{
			Name:           aws.String(ssmPath),
			WithDecryption: aws.Bool(true),
		})
		if err != nil {
			slog.Error("failed to get ssm param", "path", ssmPath, "error", err)
			continue
		}
		os.Setenv(envKey, *out.Parameter.Value)
	}
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	allowOrigins := []string{"https://veille.safecoffi.app", "https://beta.veille.safecoffi.app"}

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

	v1 := r.Group("/v1")
	{
		// Cache 5 min
		v1.GET("/feed", cacheControl("public, max-age=300, stale-while-revalidate=600"), handlers.GetFeed())

		// Cache 30 min
		v1.GET("/videos", cacheControl("public, max-age=1800"), handlers.GetVideos())
		v1.GET("/articles", cacheControl("public, max-age=1800"), handlers.GetArticles())

		// Cache 30 min
		v1.GET("/calendar", cacheControl("public, max-age=1800"), handlers.GetCalendarMeta())
		v1.GET("/graph", cacheControl("public, max-age=1800"), handlers.GetGraph())

		// Cache 24h
		v1.GET("/articles/:id", cacheControl("public, max-age=86400"), handlers.GetArticleByID())
		v1.GET("/avatar", cacheControl("public, max-age=86400"), handlers.ProxyAvatar())

		// Cache 30min
		v1.GET("/clusters", cacheControl("public, max-age=1800"), handlers.GetClusters())
		v1.GET("/clusters/:id", cacheControl("public, max-age=1800"), handlers.GetClusterByID())

		// Cache 24h
		v1.GET("/favicon", cacheControl("public, max-age=86400"), handlers.ProxyFavicon())
	}

	return r
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	godotenv.Load()
	config.InitLogger()
	loadSecrets()
	config.Init()
	defer config.DB.Close()

	r := setupRouter()

	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		ginLambda = httpadapter.NewV2(r)
		lambda.Start(handler)
	} else {
		slog.Info("gateway starting", "port", "8081")
		r.Run(":8081")
	}
}
