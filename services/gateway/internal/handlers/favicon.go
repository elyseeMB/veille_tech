package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ProxyFavicon() gin.HandlerFunc {
	return func(c *gin.Context) {
		domain := c.Query("domain")
		if domain == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		url := "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64"
		resp, err := http.Get(url)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.Status(http.StatusNotFound)
			return
		}
		defer resp.Body.Close()

		c.Header("Content-Type", resp.Header.Get("Content-Type"))
		c.Header("Cache-Control", "public, max-age=86400")
		c.Status(http.StatusOK)
		io.Copy(c.Writer, resp.Body)
	}
}
