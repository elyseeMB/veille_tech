package veille

import (
	"context"
	"log/slog"

	"github.com/mbous/veille_tech/pkg/db"
)

func ArchiveToS3(ctx context.Context, conn *db.PostgresConnection) error {
	slog.Info("archive: starting daily backup")

	var articleCount int
	err := conn.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM articles").Scan(&articleCount)
	if err != nil {
		return err
	}

	var videoCount int
	err = conn.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM videos").Scan(&videoCount)
	if err != nil {
		return err
	}

	slog.Info("archive: counts", "articles", articleCount, "videos", videoCount)

	return nil
}
