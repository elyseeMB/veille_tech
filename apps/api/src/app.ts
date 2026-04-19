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

app.get("/rss", async ({ json, res }) => {
  try {
    const response = await fetch("https://www.theverge.com/rss/index.xml", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
    });

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    return json({
      hackerNews: feed,
    });
  } catch (error) {
    return json({ error: "RSS fetch failed", status: res.status });
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
