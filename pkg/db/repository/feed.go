package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
)

func GetFeedItems(conn *db.PostgresConnection, filter coredata.FeedFilter) ([]coredata.FeedItemRow, int, error) {
	if filter.Page == 0 {
		filter.Page = 1
	}
	if filter.PerPage == 0 {
		filter.PerPage = 20
	}
	offset := (filter.Page - 1) * filter.PerPage

	whereClause := "WHERE published_at >= CURRENT_DATE - INTERVAL '1 day'"
	args := []interface{}{}

	if len(filter.Types) > 0 {
		placeholders := make([]string, len(filter.Types))
		for i, t := range filter.Types {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
			args = append(args, t)
		}
		whereClause += fmt.Sprintf(" AND type IN (%s)", strings.Join(placeholders, ", "))
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM feed_items %s", whereClause)
	err := conn.Pool.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("feed count: %w", err)
	}

	limitOffset := len(args)
	args = append(args, filter.PerPage, offset)

	selectQuery := fmt.Sprintf(
		`SELECT id, type, ref_id, published_at
		 FROM feed_items
		 %s
		 ORDER BY published_at DESC
		 LIMIT $%d OFFSET $%d`,
		whereClause, limitOffset+1, limitOffset+2,
	)

	rows, err := conn.Pool.Query(context.Background(), selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("feed query: %w", err)
	}
	defer rows.Close()

	var result []coredata.FeedItemRow
	for rows.Next() {
		var r coredata.FeedItemRow
		if err := rows.Scan(&r.ID, &r.Type, &r.RefID, &r.PublishedAt); err != nil {
			return nil, 0, fmt.Errorf("feed scan: %w", err)
		}
		result = append(result, r)
	}

	return result, total, rows.Err()
}
