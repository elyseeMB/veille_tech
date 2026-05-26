package veille

import (
	"net/url"
	"strings"
)

func ProxyAvatarURL(rawURL string) string {
	if strings.HasPrefix(rawURL, "http") {
		return "/v1/avatar?url=" + url.QueryEscape(rawURL)
	}
	return rawURL
}

func ProxyFaviconURL(domain string) string {
	if domain == "" {
		return ""
	}
	return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64"
}
