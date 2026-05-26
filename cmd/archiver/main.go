package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/joho/godotenv"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/veille"
)

func handler(ctx context.Context) error {
	conn := db.MustConnect(ctx)
	defer conn.Close()

	return veille.ArchiveToS3(ctx, conn)
}

func main() {
	godotenv.Load()
	db.InitLogger()

	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		lambda.Start(handler)
	} else {
		if err := handler(context.Background()); err != nil {
			log.Fatal("archive failed:", err)
		}
	}
}
