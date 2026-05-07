package data

import "fetcher/models"

var RSS_HEADERS = map[string]string{
	"User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
	"Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}

var RSS_FEEDS = []models.RSSFeed{
	// Tech & News
	{
		Name: "Hacker News",
		Categories: []models.Category{
			{URL: "https://hnrss.org/newest?points=100", Category: "top"},
			{URL: "https://hnrss.org/show?points=100", Category: "show"},
		},
	},
	{
		Name: "Ars Technica",
		Categories: []models.Category{
			{URL: "https://arstechnica.com/security/feed", Category: "security"},
			{URL: "https://arstechnica.com/science/feed", Category: "science"},
			{URL: "https://arstechnica.com/space/feed", Category: "space"},
		},
	},
	{
		Name: "MIT Tech Review",
		Categories: []models.Category{
			{URL: "https://www.technologyreview.com/topic/artificial-intelligence/feed", Category: "ai"},
			{URL: "https://www.technologyreview.com/topic/computing/feed", Category: "computing"},
			{URL: "https://www.technologyreview.com/topic/climate/feed", Category: "climate"},
		},
	},

	{
		Name: "Y Combinator Blog",
		Categories: []models.Category{
			{URL: "https://www.ycombinator.com/blog/rss.xml", Category: "startup"},
		},
	},
	{
		Name: "Simon Willison",
		Categories: []models.Category{
			{URL: "https://simonwillison.net/atom/everything/", Category: "ai"},
		},
	},
	{
		Name: "Pragmatic Engineer",
		Categories: []models.Category{
			{URL: "https://newsletter.pragmaticengineer.com/feed", Category: "engineering"},
		},
	},
	{
		Name: "OFF Brand by Koto",
		Categories: []models.Category{
			{URL: "https://offbrandkoto.substack.com/feed", Category: "brand/design"},
		},
	},
	{
		Name: "Wired",
		Categories: []models.Category{
			{URL: "https://www.wired.com/feed/category/science/latest/rss", Category: "science"},
			{URL: "https://www.wired.com/feed/category/security/latest/rss", Category: "security"},
			{URL: "https://www.wired.com/feed/category/business/latest/rss", Category: "business"},
			{URL: "https://www.wired.com/feed/category/backchannel/latest/rss", Category: "backchannel"},
			{URL: "https://www.wired.com/feed/category/ideas/latest/rss", Category: "ideas"},
		},
	},
}
