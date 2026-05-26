package veille

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
	"github.com/mmcdole/gofeed"
)

func extractDomain(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	return strings.TrimPrefix(u.Hostname(), "www.")
}

func FetchRSS(ctx context.Context, conn *db.PostgresConnection) error {
	var targets []repository.RSSFeedTarget
	for _, feed := range repository.RSSFeeds {
		for _, cat := range feed.Categories {
			targets = append(targets, repository.RSSFeedTarget{
				URL: cat.URL, Source: feed.Name, Category: cat.Category,
			})
		}
	}

	type Result struct {
		articles []coredata.ArticleDB
		source   string
	}

	results := make(chan Result, len(targets))
	var wg sync.WaitGroup

	for _, target := range targets {
		wg.Add(1)
		go func(t repository.RSSFeedTarget) {
			defer wg.Done()

			req, err := http.NewRequestWithContext(ctx, "GET", t.URL, nil)
			if err != nil {
				results <- Result{source: t.Source}
				return
			}
			for k, v := range repository.RSS_HEADERS {
				req.Header.Set(k, v)
			}

			res, err := repository.HTTPClient.Do(req)
			if err != nil {
				slog.Warn("feed fetch failed", "source", t.Source, "url", t.URL, "error", err)
				results <- Result{source: t.Source}
				return
			}
			defer res.Body.Close()

			fp := gofeed.NewParser()
			feed, err := fp.Parse(res.Body)
			if err != nil {
				slog.Warn("feed parse failed", "source", t.Source, "error", err)
				results <- Result{source: t.Source}
				return
			}

			if feed.Link != "" {
				domain := extractDomain(feed.Link)
				if err := repository.UpdateSourceBaseURL(conn, t.Source, domain); err != nil {
					slog.Warn("failed to update base_url", "source", t.Source, "error", err)
				}
			}

			var articles []coredata.ArticleDB
			for _, item := range feed.Items {
				id := item.GUID
				if id == "" {
					id = item.Link
				}
				author := t.Source
				if len(item.Authors) > 0 {
					author = item.Authors[0].Name
				}
				pubDate := time.Now().UTC()
				if item.PublishedParsed != nil {
					pubDate = item.PublishedParsed.UTC()
				}
				articles = append(articles, coredata.ArticleDB{
					ExternalID:  id,
					Title:       item.Title,
					URL:         item.Link,
					Author:      author,
					PublishedAt: pubDate,
					Content:     item.Description,
					Source:      t.Source,
					Category:    t.Category,
				})
			}

			results <- Result{articles: articles, source: t.Source}
		}(target)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	var allArticles []coredata.ArticleDB
	for r := range results {
		allArticles = append(allArticles, r.articles...)
	}

	seen := make(map[string]bool)
	var unique []coredata.ArticleDB
	for _, a := range allArticles {
		if !seen[a.ExternalID] {
			seen[a.ExternalID] = true
			unique = append(unique, a)
		}
	}

	slog.Info("articles collected", "total_raw", len(allArticles), "after_dedup", len(unique))

	newArticles, err := repository.FilterNewArticles(conn, unique)
	if err != nil {
		return fmt.Errorf("filter new failed: %w", err)
	}

	if err := repository.InsertArticles(conn, newArticles); err != nil {
		return fmt.Errorf("insert articles failed: %w", err)
	}

	slog.Info("rss fetch completed", "inserted", len(newArticles), "skipped", len(unique)-len(newArticles))
	return nil
}
