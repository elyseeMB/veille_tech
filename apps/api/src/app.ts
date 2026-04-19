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

// app.get("/yt-all", async (c) => {
//   const channelId = "UCxH16958KSxT4Z9yL_9JYtw";
//   const apiKey = process.env.YOUTUBE_API_KEY;

//   try {
//     const [ytResponse, ytResponsePF] = await Promise.all([
//       fetch(
//         `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${channelId.replace(/^UC/, "UU")}&maxResults=10&key=${apiKey}`,
//       ),
//       fetch(
//         `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`,
//       ),
//     ]);

//     const ytData = await ytResponse.json();
//     const ytDataPF = await ytResponsePF.json();

//     // ← Ajoute ça pour voir ce que YouTube renvoie vraiment
//     console.log("ytData:", JSON.stringify(ytData, null, 2));
//     console.log("ytDataPF:", JSON.stringify(ytDataPF, null, 2));

//     if (ytData.error) {
//       return c.json(
//         { error: ytData.error.message, code: ytData.error.code },
//         500,
//       );
//     }

//     const profile = ytDataPF.items?.[0]?.snippet?.thumbnails?.high?.url;
//     const videos = ytData.items.map((item: any) => ({
//       id: item.snippet.resourceId.videoId,
//       title: item.snippet.title,
//       description: item.snippet.description,
//       channelTitle: item.snippet.channelTitle,
//       thumbnail:
//         item.snippet.thumbnails.high?.url ??
//         item.snippet.thumbnails.medium?.url ??
//         item.snippet.thumbnails.default?.url,
//       publishedAt: item.snippet.publishedAt,
//       channelAvatar: profile,
//     }));

//     return c.json({ videos });
//   } catch (error) {
//     console.error(error);
//     return c.json({ error: error.message }, 500);
//   }
// });

export default app;
