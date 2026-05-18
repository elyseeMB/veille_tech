package handlers

import (
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func ProxyFavicon() gin.HandlerFunc {
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	return func(c *gin.Context) {
		domain := c.Query("domain")
		if domain == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		url := "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64"
		req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, url, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; FaviconProxy/1.0)")

		resp, err := client.Do(req)
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.Status(http.StatusNotFound)
			return
		}

		c.Header("Content-Type", resp.Header.Get("Content-Type"))

		c.Status(http.StatusOK)
		io.Copy(c.Writer, resp.Body)
	}
}
