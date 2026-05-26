package db

import (
	"context"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresConnection struct {
	Pool *pgxpool.Pool
}

func NewPostgresConnection(ctx context.Context, databaseURL string) (*PostgresConnection, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return &PostgresConnection{Pool: pool}, nil
}

func MustConnect(ctx context.Context) *PostgresConnection {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		slog.Error("DATABASE_URL not set")
		os.Exit(1)
	}

	conn, err := NewPostgresConnection(ctx, databaseURL)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}

	slog.Info("database connected")
	return conn
}

func (c *PostgresConnection) Close() {
	if c.Pool != nil {
		c.Pool.Close()
	}
}
