package data

import "fetcher/models"

var RSS_HEADERS = map[string]string{
	"User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
	"Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}

var RSS_FEEDS = []models.RSSFeed{
	{
		Name: "Hacker News",
		Categories: []models.Category{
			{URL: "https://hnrss.org/frontpage", Category: "frontpage"},
			{URL: "https://hnrss.org/newest?points=100", Category: "top"},
			{URL: "https://hnrss.org/ask", Category: "ask"},
			{URL: "https://hnrss.org/show", Category: "show"},
			{URL: "https://hnrss.org/jobs", Category: "jobs"},
		},
	},
	{
		Name: "The Verge",
		Categories: []models.Category{
			{URL: "https://www.theverge.com/rss/index.xml", Category: "Today's Stream"},
			{URL: "https://www.theverge.com/rss/tech/index.xml", Category: "tech"},
			{URL: "https://www.theverge.com/rss/science/index.xml", Category: "science"},
			{URL: "https://www.theverge.com/rss/cyber-security/index.xml", Category: "security"},
			{URL: "https://www.theverge.com/rss/space/index.xml", Category: "space"},
		},
	},
	{
		Name: "Ars Technica",
		Categories: []models.Category{
			{URL: "https://feeds.arstechnica.com/arstechnica/index", Category: "all"},
			{URL: "https://arstechnica.com/ai/feed", Category: "ai"},
			{URL: "https://arstechnica.com/security/feed", Category: "security"},
			{URL: "https://arstechnica.com/science/feed", Category: "science"},
			{URL: "https://arstechnica.com/space/feed", Category: "space"},
		},
	},
	{
		Name: "MIT Tech Review",
		Categories: []models.Category{
			{URL: "https://www.technologyreview.com/feed", Category: "All Topics"},
			{URL: "https://www.technologyreview.com/topic/artificial-intelligence/feed", Category: "ai"},
			{URL: "https://www.technologyreview.com/topic/computing/feed", Category: "computing"},
			{URL: "https://www.technologyreview.com/topic/climate/feed", Category: "climate"},
			{URL: "https://www.technologyreview.com/topic/space/feed", Category: "space"},
		},
	},
	{
		Name: "Wired",
		Categories: []models.Category{
			{URL: "https://www.wired.com/feed/rss", Category: "Today's Picks"},
			{URL: "https://www.wired.com/feed/category/science/latest/rss", Category: "science"},
			{URL: "https://www.wired.com/feed/category/security/latest/rss", Category: "security"},
			{URL: "https://www.wired.com/feed/tag/ai/latest/rss", Category: "ai"},
		},
	},
}
