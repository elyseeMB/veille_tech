package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"sort"
	"sync"
	"time"

	"fetcher/data"
	"fetcher/models"
	"fetcher/repository"

	"github.com/gin-gonic/gin"
	"github.com/mmcdole/gofeed"
)

func GetRSS() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		defer cancel()

		sourceFilter := c.Query("source")
		categoryFilter := c.Query("category")

		slog.Debug("rss fetch started",
			"source_filter", sourceFilter,
			"category_filter", categoryFilter,
		)

		type FeedTarget struct {
			URL      string
			Source   string
			Category string
		}

		var targets []FeedTarget

		for _, feed := range data.RSS_FEEDS {
			if sourceFilter != "" && feed.Name != sourceFilter {
				continue
			}
			for _, cat := range feed.Categories {
				if categoryFilter != "" && cat.Category != categoryFilter {
					continue
				}
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
					articles = append(articles, models.Article{
						ID:       id,
						Title:    item.Title,
						Link:     item.Link,
						Author:   author,
						PubDate:  item.Published,
						Content:  item.Description,
						Source:   t.Source,
						Category: t.Category,
					})
				}

				slog.Debug("feed fetched", "source", t.Source, "category", t.Category, "count", len(articles))

				results <- Result{articles: articles, source: t.Source}
			}(target)
		}

		go func() {
			wg.Wait()
			close(results)
		}()

		var allArticles []models.Article
		for result := range results {
			allArticles = append(allArticles, result.articles...)
		}

		seen := make(map[string]bool)
		var unique []models.Article
		for _, a := range allArticles {
			if !seen[a.ID] {
				seen[a.ID] = true
				unique = append(unique, a)
			}
		}

		slog.Info("articles collected", "total_raw", len(allArticles), "after_dedup", len(unique))

		newArticles, err := repository.FilterNew(unique)
		if err != nil {
			slog.Error("filter new failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := repository.InsertArticles(newArticles); err != nil {
			slog.Error("insert articles failed", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		slog.Info("articles synced", "new", len(newArticles), "skipped", len(unique)-len(newArticles))

		yesterday := time.Now().AddDate(0, 0, -1)
		yesterday = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, time.UTC)

		var filtered []models.Article
		for _, a := range newArticles {
			pubDate, err := time.Parse(time.RFC1123Z, a.PubDate)
			if err != nil {
				pubDate, err = time.Parse(time.RFC3339, a.PubDate)
				if err != nil {
					continue
				}
			}
			if pubDate.After(yesterday) {
				filtered = append(filtered, a)
			}
		}

		sort.Slice(filtered, func(i, j int) bool {
			dateI, _ := time.Parse(time.RFC1123Z, filtered[i].PubDate)
			dateJ, _ := time.Parse(time.RFC1123Z, filtered[j].PubDate)
			return dateI.After(dateJ)
		})

		slog.Info("rss fetch completed", "inserted", len(newArticles), "returned", len(filtered))

		c.JSON(http.StatusOK, gin.H{
			"articles": filtered,
			"inserted": len(newArticles),
			"total":    len(unique),
		})
	}
}
