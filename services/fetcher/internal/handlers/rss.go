package handlers

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"fetcher/internal/data"
	"fetcher/internal/models"
	"fetcher/internal/repository"

	"github.com/mmcdole/gofeed"
)

func FetchRSS(ctx context.Context) error {
	type FeedTarget struct {
		URL      string
		Source   string
		Category string
	}

	var targets []FeedTarget
	for _, feed := range data.RSS_FEEDS {
		for _, cat := range feed.Categories {
			targets = append(targets, FeedTarget{
				URL:      cat.URL,
				Source:   feed.Name,
				Category: cat.Category,
			})
		}
	}

	slog.Debug("feed targets selected", "count", len(targets))

	type Result struct {
		articles []models.Article
		source   string
	}

	results := make(chan Result, len(targets))
	var wg sync.WaitGroup

	for _, target := range targets {
		wg.Add(1)
		go func(t FeedTarget) {
			defer wg.Done()

			req, err := http.NewRequestWithContext(ctx, "GET", t.URL, nil)
			if err != nil {
				slog.Warn("failed to create request", "url", t.URL, "error", err)
				results <- Result{source: t.Source}
				return
			}

			for k, v := range data.RSS_HEADERS {
				req.Header.Set(k, v)
			}

			res, err := httpClient.Do(req)
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

			var articles []models.Article
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
				articles = append(articles, models.Article{
					ID:       id,
					Title:    item.Title,
					Link:     item.Link,
					Author:   author,
					PubDate:  pubDate,
					Content:  item.Description,
					Source:   t.Source,
					Category: t.Category,
				})
			}

			slog.Debug("feed fetched",
				"source", t.Source,
				"category", t.Category,
				"count", len(articles),
			)

			results <- Result{articles: articles, source: t.Source}
		}(target)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	var allArticles []models.Article
	for r := range results {
		allArticles = append(allArticles, r.articles...)
	}

	seen := make(map[string]bool)
	var unique []models.Article
	for _, a := range allArticles {
		if !seen[a.ID] {
			seen[a.ID] = true
			unique = append(unique, a)
		}
	}

	slog.Info("articles collected",
		"total_raw", len(allArticles),
		"after_dedup", len(unique),
	)

	newArticles, err := repository.FilterNew(unique)
	if err != nil {
		return fmt.Errorf("filter new failed: %w", err)
	}

	if err := repository.InsertArticles(newArticles); err != nil {
		return fmt.Errorf("insert articles failed: %w", err)
	}

	slog.Info("rss fetch completed",
		"inserted", len(newArticles),
		"skipped", len(unique)-len(newArticles),
	)

	_ = time.Now() // garde l'import si utilisé ailleurs
	return nil
}
