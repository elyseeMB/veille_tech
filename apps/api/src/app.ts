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

app.get("/rss", async ({ json }) => {
  const hackerNews = await parser.parseURL(
    "https://feeds.feedburner.com/TheHackersNews",
  );

  return json({
    hackerNews: hackerNews.items.slice(0, 10),
  });
});

export default app;
