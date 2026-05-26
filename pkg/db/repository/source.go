package repository

import (
	"context"

	"github.com/mbous/veille_tech/pkg/db"
)

var RSS_HEADERS = map[string]string{
	"User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
	"Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}

type RSSFeedTarget struct {
	URL      string
	Source   string
	Category string
}

type RSSFeedConfig struct {
	Name       string
	Categories []CategoryConfig
}

type CategoryConfig struct {
	URL      string
	Category string
}

type YouTubeChannelConfig struct {
	ID   string
	Name string
}

var RSSFeeds = []RSSFeedConfig{
	{Name: "Hacker News", Categories: []CategoryConfig{
		{URL: "https://hnrss.org/newest?points=100", Category: "top"},
		{URL: "https://hnrss.org/show?points=100", Category: "show"},
	}},
	{Name: "Ars Technica", Categories: []CategoryConfig{
		{URL: "https://arstechnica.com/security/feed", Category: "security"},
		{URL: "https://arstechnica.com/science/feed", Category: "science"},
		{URL: "https://arstechnica.com/space/feed", Category: "space"},
	}},
	{Name: "MIT Tech Review", Categories: []CategoryConfig{
		{URL: "https://www.technologyreview.com/topic/artificial-intelligence/feed", Category: "ai"},
		{URL: "https://www.technologyreview.com/topic/computing/feed", Category: "computing"},
		{URL: "https://www.technologyreview.com/topic/climate/feed", Category: "climate"},
	}},
	{Name: "Lobsters", Categories: []CategoryConfig{
		{URL: "https://lobste.rs/top/1d.rss", Category: "top"},
		{URL: "https://lobste.rs/top/1w.rss", Category: "top"},
		{URL: "https://lobste.rs/top/1m.rss", Category: "top"},
	}},
	{Name: "Y Combinator Blog", Categories: []CategoryConfig{
		{URL: "https://www.ycombinator.com/blog/rss.xml", Category: "startup"},
	}},
	{Name: "Simon Willison", Categories: []CategoryConfig{
		{URL: "https://simonwillison.net/atom/everything/", Category: "ai"},
	}},
	{Name: "Pragmatic Engineer", Categories: []CategoryConfig{
		{URL: "https://newsletter.pragmaticengineer.com/feed", Category: "engineering"},
	}},
	{Name: "OFF Brand by Koto", Categories: []CategoryConfig{
		{URL: "https://offbrandkoto.substack.com/feed", Category: "brand/design"},
	}},
	{Name: "Wired", Categories: []CategoryConfig{
		{URL: "https://www.wired.com/feed/category/science/latest/rss", Category: "science"},
		{URL: "https://www.wired.com/feed/category/security/latest/rss", Category: "security"},
		{URL: "https://www.wired.com/feed/category/business/latest/rss", Category: "business"},
		{URL: "https://www.wired.com/feed/category/backchannel/latest/rss", Category: "backchannel"},
		{URL: "https://www.wired.com/feed/category/ideas/latest/rss", Category: "ideas"},
	}},
}

var YouTubeChannels = []YouTubeChannelConfig{
	{ID: "UCYnvxJ-PKiGXo_tYXpWAC-w", Name: "Micode"},
	{ID: "UCWedHS9qKebauVIK2J7383g", Name: "Underscore"},
	{ID: "UCYO_jab_esuFRV4b17AJtAw", Name: "3Blue1Brown"},
	{ID: "UCsBjURrPoezykLs9EqgamOA", Name: "Fireship"},
	{ID: "UC9-y-6csu5WGm29I7JiwpnA", Name: "Computerphile"},
	{ID: "UCHnyfMqiRRG1u-2MsSQLbXA", Name: "Veritasium"},
	{ID: "UCsXVk37bltHxD1rDPwtNM8Q", Name: "Kurzgesagt"},
	{ID: "UCBa659QWEk1AI4Tg--mrJ2A", Name: "Tom Scott"},
	{ID: "UC9RM-iSvTu1uPJb8X5yp3EQ", Name: "Wendover"},
	{ID: "UCUyeluBRhGPCW4rPe_UvBZQ", Name: "The PrimeTime"},
	{ID: "UCbRP3c757lWg9M-U7TyEkXA", Name: "Theo - t3․gg"},
	{ID: "UCFbNIlppjAuEX4znoulh0Cw", Name: "Web Dev Simplified"},
}

func SeedSources(conn *db.PostgresConnection) error {
	tx, err := conn.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for _, feed := range RSSFeeds {
		var sourceID string
		err := tx.QueryRow(
			context.Background(),
			`INSERT INTO sources (name, type)
			VALUES ($1, 'rss')
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id`,
			feed.Name,
		).Scan(&sourceID)
		if err != nil {
			return err
		}

		for _, cat := range feed.Categories {
			_, err := tx.Exec(
				context.Background(),
				`INSERT INTO source_categories (source_id, category, feed_url)
				VALUES ($1, $2, $3)
				ON CONFLICT (source_id, category) DO NOTHING`,
				sourceID, cat.Category, cat.URL,
			)
			if err != nil {
				return err
			}
		}
	}

	for _, channel := range YouTubeChannels {
		_, err := tx.Exec(
			context.Background(),
			`INSERT INTO sources (name, base_url, type)
			VALUES ($1, $2, 'youtube')
			ON CONFLICT (name) DO NOTHING`,
			channel.Name,
			"https://www.youtube.com/channel/"+channel.ID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}
