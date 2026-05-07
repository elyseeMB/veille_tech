package main

import (
	"context"
	"fetcher/internal/config"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	config.InitDB()

	res, err := config.DB.Exec(context.Background(),
		`INSERT INTO feed_items (type, ref_id, published_at)
         SELECT 'article', id, published_at FROM articles
         ON CONFLICT (type, ref_id) DO NOTHING`,
	)
	if err != nil {
		log.Fatal("articles backfill failed:", err)
	}
	log.Printf("articles insérés : %d", res.RowsAffected())

	res, err = config.DB.Exec(context.Background(),
		`INSERT INTO feed_items (type, ref_id, published_at)
         SELECT 'video', id, published_at FROM videos
         ON CONFLICT (type, ref_id) DO NOTHING`,
	)
	if err != nil {
		log.Fatal("videos backfill failed:", err)
	}
	log.Printf("videos insérés : %d", res.RowsAffected())
}
