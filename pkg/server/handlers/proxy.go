package handlers

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func ProxyFavicon() gin.HandlerFunc {
	client := &http.Client{Timeout: 5 * time.Second}

	return func(c *gin.Context) {
		domain := c.Query("domain")
		if domain == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		url := fmt.Sprintf(
			"https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://%s&size=128",
			domain,
		)
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

func ProxyAvatar() gin.HandlerFunc {
	client := &http.Client{Timeout: 5 * time.Second}

	return func(c *gin.Context) {
		imgURL := c.Query("url")
		if imgURL == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, imgURL, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; AvatarProxy/1.0)")

		resp, err := client.Do(req)
		if err != nil {
			c.Status(http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.Status(http.StatusBadGateway)
			return
		}

		c.Header("Content-Type", resp.Header.Get("Content-Type"))
		c.Status(http.StatusOK)
		io.Copy(c.Writer, resp.Body)
	}
}
