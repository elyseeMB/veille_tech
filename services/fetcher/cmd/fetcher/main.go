package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"fetcher/internal/config"
	"fetcher/internal/handlers"
	"fetcher/internal/repository"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"

	"github.com/joho/godotenv"
)

func loadSecrets() {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") == "" || os.Getenv("LOCAL_DEV") == "true" {
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
		"DATABASE_URL":    os.Getenv("DB_PARAM_NAME"),
		"YOUTUBE_API_KEY": os.Getenv("YT_PARAM_NAME"),
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
