package config

import (
	"context"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func InitDB() {
	var err error

	DB, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		slog.Error("unable to connect to database", "error", err)
		os.Exit(1)
	}

	if err := DB.Ping(context.Background()); err != nil {
		slog.Error("database ping failed", "error", err)
		os.Exit(1)
	}

	slog.Info("connected to database")
}
