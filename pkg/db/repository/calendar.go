package repository

import (
	"context"

	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
)

func GetCalendarMeta(conn *db.PostgresConnection) (map[string]coredata.CalendarMeta, error) {
	query := `
        SELECT TO_CHAR(published_at, 'YYYY-MM-DD') as day, COUNT(*)
        FROM articles a
		JOIN sources s ON s.id = a.source_id AND active = true
        WHERE s.active = true AND a.published_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY day
        ORDER BY day DESC`

	rows, err := conn.Pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]coredata.CalendarMeta)
	for rows.Next() {
		var day string
		var count int
		if err := rows.Scan(&day, &count); err != nil {
			return nil, err
		}
		stats[day] = coredata.CalendarMeta{Count: count}
	}

	return stats, nil
}
