package daemon

import (
	"context"
	"log/slog"
	"os"

	"github.com/mbous/veille_tech/pkg/cfg"
	"github.com/mbous/veille_tech/pkg/db"
)

type App struct {
	DB  *db.PostgresConnection
	Cfg *cfg.Config
}

func New(configPath string) *App {
	config, err := cfg.Load(configPath)
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	db.InitLogger()

	conn := db.MustConnect(context.Background())

	return &App{
		DB:  conn,
		Cfg: config,
	}
}

func (a *App) Close() {
	if a.DB != nil {
		a.DB.Close()
	}
}
