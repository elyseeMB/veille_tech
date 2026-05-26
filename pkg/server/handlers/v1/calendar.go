package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
)

func GetCalendarMeta(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats, err := repository.GetCalendarMeta(conn)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, stats)
	}
}
