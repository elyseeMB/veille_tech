package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/joho/godotenv"
	"github.com/mbous/veille_tech/pkg/awsconfig"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/server"
)

var ginLambda *httpadapter.HandlerAdapterV2

func loadSecrets() {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") == "" {
		return
	}

	ctx := context.TODO()
	clients, err := awsconfig.NewClients(ctx)
	if err != nil {
		slog.Error("unable to load SDK config", "error", err)
		return
	}

	awsconfig.LoadSecrets(ctx, clients.SSM, map[string]string{
		"DATABASE_URL": os.Getenv("DB_PARAM_NAME"),
	})
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	godotenv.Load()
	db.InitLogger()
	loadSecrets()

	conn := db.MustConnect(context.Background())
	defer conn.Close()

	r := server.NewRouter(conn)

	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		ginLambda = httpadapter.NewV2(r)
		lambda.Start(handler)
	} else {
		slog.Info("server starting", "port", "8081")
		r.Run(":8081")
	}
}
