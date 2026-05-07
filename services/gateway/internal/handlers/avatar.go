package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ProxyAvatar() gin.HandlerFunc {
	return func(c *gin.Context) {
		imgURL := c.Query("url")
		if imgURL == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		resp, err := http.Get(imgURL)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.Status(http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		c.DataFromReader(
			http.StatusOK,
			resp.ContentLength,
			resp.Header.Get("Content-Type"),
			resp.Body,
			nil,
		)
	}
}
