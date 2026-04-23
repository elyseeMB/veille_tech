package repository

import (
	"context"
	"fmt"
	"gateway/config"
	"gateway/models"
)

func GetMeta() (map[string]models.CalendarMeta, error) {
	query := `
        SELECT TO_CHAR(published_at, 'YYYY-MM-DD') as day, COUNT(*)
        FROM articles
        WHERE published_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY day
        ORDER BY day DESC`

	rows, err := config.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	fmt.Printf("rows %v\n", rows)

	stats := make(map[string]models.CalendarMeta)

	for rows.Next() {
		var day string
		var count int
		if err := rows.Scan(&day, &count); err != nil {
			return nil, err
		}
		stats[day] = models.CalendarMeta{
			Count: count,
		}
	}

	return stats, nil
}
