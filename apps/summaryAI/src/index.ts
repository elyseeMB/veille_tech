import { Hono } from "hono";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { parseHTML } from "linkedom";
import { load } from "cheerio";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/text", async (c) => {
  const url = "https://drobinin.com/posts/my-phone-replaced-a-brass-plug/";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
    });
    const html = await res.text();
    console.log(html.length);

    // arstechnica.com parsing in article HTMLElement
    const { document } = parseHTML(html);

    const body = document
      .querySelector("main")
      ?.querySelector("article")
      ?.textContent.trim();

    // const text = body?.textContent?.trim();

    const data = new Readability(document).parse();

    const result = data?.content!;
    const cleaning = load(result);

    cleaning(
      "script, style, nav, footer, header, aside, iframe, noscript",
    ).remove();
    cleaning(
      "[class*='nav'], [class*='menu'], [class*='sidebar'], [class*='banner']",
    ).remove();
    cleaning(
      "[class*='comment'], [class*='related'], [class*='popular'], [class*='trending']",
    ).remove();
    cleaning(
      "[class*='ad-'], [class*='-ad'], [id*='ad-'], [class*='promo']",
    ).remove();
    cleaning(
      "[class*='subscribe'], [class*='newsletter'], [class*='signup']",
    ).remove();

    cleaning(
      "[class*='author'], [class*='byline'], [class*='bio'], [class*='writer']",
    ).remove();
    cleaning(
      "[class*='most-read'], [class*='read-next'], [class*='recommended']",
    ).remove();
    cleaning("figure, figcaption").remove();

    cleaning("p")
      .last()
      .each((_, el) => {
        const text = cleaning(el).text().trim();
        if (
          text.length < 200 &&
          /commission|affiliate|independen|privacy|cookie/i.test(text)
        ) {
          cleaning(el).remove();
        }
      });

    cleaning("*").each((_, el) => {
      const text = cleaning(el).text().trim();
      if (
        text.length < 100 &&
        /^(skip to content|sign in|subscribe|search|menu|close|back to top|\d+ comments?|photo of .+|listing image for .+)$/i.test(
          text,
        )
      ) {
        cleaning(el).remove();
      }
    });

    return c.html(cleaning.html());
  } catch (error) {
    console.error(error);
    return c.json({ error });
  }

  // new Readability(document).parse();
});

export default app;
