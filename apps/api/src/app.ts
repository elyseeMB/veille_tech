import { Hono } from "hono";
import { cors } from "hono/cors";
import Parser from "rss-parser";

const app = new Hono();

const parser = new Parser();

app.use("*", async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: "*",
  });
  return corsMiddlewareHandler(c, next);
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const RSS_FEEDS = [
  {
    name: "Hacker News",
    categories: [
      { url: "https://hnrss.org/frontpage", category: "frontpage" },
      { url: "https://hnrss.org/newest?points=100", category: "top" },
      { url: "https://hnrss.org/ask", category: "ask" },
      { url: "https://hnrss.org/show", category: "show" },
      { url: "https://hnrss.org/jobs", category: "jobs" },
    ],
  },
  {
    name: "The Verge",
    categories: [
      {
        url: "https://www.theverge.com/rss/index.xml",
        category: "Today’s Stream",
      },
      { url: "https://www.theverge.com/rss/tech/index.xml", category: "tech" },
      {
        url: "https://www.theverge.com/rss/science/index.xml",
        category: "science",
      },
      {
        url: "https://www.theverge.com/rss/cyber-security/index.xml",
        category: "security",
      },
      {
        url: "https://www.theverge.com/rss/space/index.xml",
        category: "space",
      },
    ],
  },
  {
    name: "Ars Technica",
    categories: [
      {
        url: "https://feeds.arstechnica.com/arstechnica/index",
        category: "all",
      },
      { url: "https://arstechnica.com/ai/feed", category: "ai" },
      { url: "https://arstechnica.com/security/feed", category: "security" },
      { url: "https://arstechnica.com/science/feed", category: "science" },
      { url: "https://arstechnica.com/space/feed", category: "space" },
    ],
  },
  {
    name: "MIT Tech Review",
    categories: [
      { url: "https://www.technologyreview.com/feed", category: "all" },
      {
        url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        category: "ai",
      },
      {
        url: "https://www.technologyreview.com/topic/computing/feed",
        category: "computing",
      },
      {
        url: "https://www.technologyreview.com/topic/climate/feed",
        category: "climate",
      },
      {
        url: "https://www.technologyreview.com/topic/space/feed",
        category: "space",
      },
    ],
  },
  {
    name: "Wired",
    categories: [
      { url: "https://www.wired.com/feed/rss", category: "all" },
      {
        url: "https://www.wired.com/feed/category/science/latest/rss",
        category: "science",
      },
      {
        url: "https://www.wired.com/feed/category/security/latest/rss",
        category: "security",
      },
      { url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "ai" },
    ],
  },
] as const;

const RSS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
};

app.get("/rss", async (c) => {
  const sourceFilter = c.req.query("source");
  const categoryFilter = c.req.query("category");

  const feeds = RSS_FEEDS.filter(
    ({ name }) => !sourceFilter || name === sourceFilter,
  ).flatMap(({ name, categories }) =>
    categories
      .filter(({ category }) => !categoryFilter || category === categoryFilter)
      .map((f) => ({ ...f, source: name })),
  );

  try {
    const results = await Promise.all(
      feeds.map(async ({ url, source, category }) => {
        const response = await fetch(url, { headers: RSS_HEADERS });
        const xml = await response.text();
        const feed = await parser.parseString(xml);

        return (feed.items ?? []).map((item) => ({
          id: item.guid ?? item.link ?? "",
          title: item.title ?? "",
          link: item.link ?? "",
          author: item.creator ?? item.author ?? source,
          pubDate: item.pubDate ?? item.isoDate ?? "",
          content: item.contentSnippet ?? item.content ?? "",
          source,
          category,
        }));
      }),
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const seen = new Set<string>();
    const articles = results
      .flat()
      .filter((a) => {
        if (seen.has(a.id)) {
          return false;
        }
        seen.add(a.id);
        return true;
      })
      .filter((item) => new Date(item.pubDate) >= yesterday)
      .sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
      );

    return c.json({ articles });
  } catch (error) {
    console.error(error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

const CHANNELS = [
  "UCYnvxJ-PKiGXo_tYXpWAC-w", // Micode
  "UCWedHS9qKebauVIK2J7383g", // Underscore
  "UCYO_jab_esuFRV4b17AJtAw", // 3Blue1Brown
  "UCsBjURrPoezykLs9EqgamOA", // Fireship
  "UC9-y-6csu5WGm29I7JiwpnA", // Computerphile
  "UCHnyfMqiRRG1u-2MsSQLbXA", // Veritasium
  "UCsXVk37bltHxD1rDPwtNM8Q", // Kurzgesagt
  "UCBa659QWEk1AI4Tg--mrJ2A", // Tom Scott
  "UC9RM-iSvTu1uPJb8X5yp3EQ", // Wendover
  "UCxH16958KSxT4Z9yL_9JYtw",
];

app.get("/avatar", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json({ error: "Missing url" }, 400);
  }
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public max-age=86400",
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error avatar fetch failed" }, 500);
  }
});

app.get("/yt-all", async (c) => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  try {
    const results = await Promise.all(
      CHANNELS.map(async (channelId) => {
        const [ytResponse, profileResponse] = await Promise.all([
          fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${channelId.replace(/^UC/, "UU")}&maxResults=5&key=${apiKey}`,
          ),
          fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`,
          ),
        ]);

        const ytData = await ytResponse.json();
        const profileData = await profileResponse.json();

        if (ytData.error) {
          throw new Error(ytData.error.message);
        }

        const avatar =
          profileData.items?.[0]?.snippet?.thumbnails?.high?.url ??
          profileData.items?.[0]?.snippet?.thumbnails?.medium?.url ??
          profileData.items?.[0]?.snippet?.thumbnails?.default?.url;

        const channelAvatar = avatar
          ? `/avatar?url=${encodeURIComponent(avatar)}`
          : undefined;

        return (ytData.items ?? []).map((item: any) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          thumbnail:
            item.snippet.thumbnails.high?.url ??
            item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelAvatar,
        }));
      }),
    );

    const videos = results
      .flat()
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );

    return c.json({ videos });
  } catch (error) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
