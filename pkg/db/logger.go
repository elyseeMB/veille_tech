package db

import (
	"log/slog"
	"os"
)

func InitLogger() {
	var handler slog.Handler

	if os.Getenv("LOG_FORMAT") == "json" || os.Getenv("GIN_MODE") == "release" || os.Getenv("ENVIRONMENT") == "production" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}

	slog.SetDefault(slog.New(handler))
}
