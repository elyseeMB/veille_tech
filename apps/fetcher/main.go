package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"fetcher/config"
	"fetcher/handlers"
	"fetcher/repository"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/joho/godotenv"
)

func handler(ctx context.Context) error {
	config.InitLogger()
	config.InitDB()
	defer config.DB.Close()

	if err := repository.SeedSources(); err != nil {
		slog.Error("failed to seed sources", "error", err)
		os.Exit(1)
	}
	slog.Info("sources seeded")

	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	if err := handlers.FetchRSS(ctx); err != nil {
		slog.Error("rss fetch failed", "error", err)
		return err
	}

	if err := handlers.FetchYouTube(ctx); err != nil {
		slog.Error("youtube fetch failed", "error", err)
		return err
	}

	return nil
}

func main() {
	godotenv.Load()

	// Local ou Lambda ?
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		// Sur Lambda → mode Lambda
		lambda.Start(handler)
	} else {
		// En local → exécution directe
		if err := handler(context.Background()); err != nil {
			slog.Error("handler failed", "error", err)
			os.Exit(1)
		}
	}
}
