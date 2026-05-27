package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/joho/godotenv"
	"github.com/mbous/veille_tech/pkg/awsconfig"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
	"github.com/mbous/veille_tech/pkg/veille"
)

func loadSecrets() {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") == "" || os.Getenv("LOCAL_DEV") == "true" {
		return
	}

	ctx := context.TODO()
	clients, err := awsconfig.NewClients(ctx)
	if err != nil {
		slog.Error("unable to load SDK config", "error", err)
		return
	}

	awsconfig.LoadSecrets(ctx, clients.SSM, map[string]string{
		"DATABASE_URL":    os.Getenv("DB_PARAM_NAME"),
		"YOUTUBE_API_KEY": os.Getenv("YT_PARAM_NAME"),
	})
}

func handler(ctx context.Context) error {
	conn := db.MustConnect(ctx)
	defer conn.Close()

	if err := repository.SeedSources(conn); err != nil {
		slog.Error("failed to seed sources", "error", err)
		os.Exit(1)
	}
	slog.Info("sources seeded")

	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	if err := veille.FetchRSS(ctx, conn); err != nil {
		slog.Error("rss fetch failed", "error", err)
		return err
	}

	if err := veille.FetchYouTube(ctx, conn); err != nil {
		slog.Error("youtube fetch failed", "error", err)
		return err
	}

	return nil
}

func main() {
	godotenv.Load()
	db.InitLogger()
	loadSecrets()

	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		lambda.Start(handler)
	} else {
		if err := handler(context.Background()); err != nil {
			slog.Error("handler failed", "error", err)
			os.Exit(1)
		}
	}
}
