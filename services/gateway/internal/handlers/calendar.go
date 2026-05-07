package handlers

import (
	"gateway/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetCalendarMeta() gin.HandlerFunc {
	return func(c *gin.Context) {
		articles, err := repository.GetMeta()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, articles)
	}
}
