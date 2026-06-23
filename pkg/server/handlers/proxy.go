package handlers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type ProxyRule struct {
	AllowedHosts map[string]bool
	HTTPSOnly    bool
	ParamName    string
}

var FaviconRule = ProxyRule{
	ParamName:    "domain",
	HTTPSOnly:    false,
	AllowedHosts: nil,
}

var AvatarRule = ProxyRule{
	ParamName: "url",
	HTTPSOnly: true,
	AllowedHosts: map[string]bool{
		"yt3.ggpht.com":             true,
		"yt3.googleusercontent.com": true,
		"i.ytimg.com":               true,
	},
}

var sizeParam = regexp.MustCompile(`=s\d+`)

func SecureProxy(rule ProxyRule) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.Query(rule.ParamName)
		if raw == "" {
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}

		parsed, err := url.Parse(raw)
		if err != nil {
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}

		if rule.HTTPSOnly && parsed.Scheme != "https" {
			c.AbortWithStatus(http.StatusForbidden)
			return

		}

		if len(rule.AllowedHosts) > 0 && !rule.AllowedHosts[parsed.Hostname()] {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		c.Next()
	}
}

func ProxyFavicon() gin.HandlerFunc {
	client := &http.Client{Timeout: 5 * time.Second}

	return func(c *gin.Context) {
		domain := c.Query("domain")

		if strings.ContainsAny(domain, "/:@?#") {
			c.Status(http.StatusBadRequest)
			return
		}

		faviconURL := fmt.Sprintf(
			"https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://%s&size=128",
			url.QueryEscape(domain),
		)

		req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, faviconURL, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; FaviconProxy/1.0)")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.Status(http.StatusNotFound)
			return
		}
		defer resp.Body.Close()

		c.Header("Content-Type", resp.Header.Get("Content-Type"))
		c.Status(http.StatusOK)
		io.Copy(c.Writer, resp.Body)
	}
}

func ProxyAvatar() gin.HandlerFunc {
	client := &http.Client{Timeout: 5 * time.Second}

	return func(c *gin.Context) {
		imgURL := c.Query("url")

		imgURL = sizeParam.ReplaceAllString(imgURL, "=s88")

		req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, imgURL, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; AvatarProxy/1.0)")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.Status(http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		contentType := resp.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, "image/") {
			c.Status(http.StatusBadGateway)
			return
		}

		c.Header("Content-Type", contentType)
		c.Status(http.StatusOK)
		io.Copy(c.Writer, resp.Body)
	}
}
