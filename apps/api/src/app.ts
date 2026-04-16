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
    const response = await fetch(
      "https://thehackernews.com/feeds/posts/default",
    );
    const xml = await response.text();
    const feed = await parser.parseString(xml);
    return json({
      hackerNews: feed.items,
    });
  } catch (error) {
    return json({ error: "RSS fetch failed", status: res.status });
  }
});

export default app;
