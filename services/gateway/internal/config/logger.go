package config

import (
	"log/slog"
	"os"
)

func InitLogger() {
	var handler slog.Handler

	if os.Getenv("GIN_MODE") == "release" {
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
