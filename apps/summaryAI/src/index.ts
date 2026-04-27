import { Defuddle } from "defuddle/node";
import { Hono } from "hono";
import { parseHTML } from "linkedom";
import { GetContent } from "./actions/getContent.js";
import { db } from "./config/conn.js";

const app = new Hono();

app.get("/all", async (c) => {
  const articles = await db
    .selectFrom("articles")
    .select(["id", "url"])
    // .where((eb) =>
    //   eb.or([
    //     eb("content", "is", null),
    //     eb("content", "=", ""),
    //     eb(eb.fn("length", ["content"]), "<", eb.val(200)),
    //   ]),
    // )
    .execute();

  const BATCH_SIZE = 10;
  const DELAY_MS = 2000;
  const results = [];

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (article) => {
        try {
          const scraper = new GetContent(article.url);
          const content = await scraper.getOriginalContent();

          if (!content?.content) return { id: article.id, status: "empty" };

          // Transaction — si l'update échoue, rien n'est écrit
          await db.transaction().execute(async (trx) => {
            await trx
              .updateTable("articles")
              .set({ content: content.content })
              .where("id", "=", article.id)
              .execute();
          });

          return { id: article.id, status: "ok" };
        } catch (err) {
          console.error(`Error scraping ${article.url}:`, err);
          return { id: article.id, status: "error" };
        }
      }),
    );

    results.push(
      ...batchResults.map((r) =>
        r.status === "fulfilled" ? r.value : { status: "error" },
      ),
    );

    if (i + BATCH_SIZE < articles.length) {
      console.log(`Batch ${i / BATCH_SIZE + 1} done, waiting ${DELAY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error").length;
  const empty = results.filter((r) => r.status === "empty").length;

  return c.json({ total: results.length, ok, errors, empty });
});

// app.on(["GET", "POST"], "/summary/:articleId", async (c) => {
//   if (!c.req.param("articleId")) {
//     return c.json({ error: "id not found" });
//   }
//   const res = new GetContent(c.req.param("articleId"));
//   const content = await res.getOriginalContent();
//   return c.json({ originalCotent: content });
// });

// app.post("/cloudflare", async (c) => {
//   try {
//     const body = await c.req.json();
//     const { url } = body;

//     if (!url) {
//       return c.json({ error: "URL manquante" }, 400);
//     }

//     // 1. Fetch et parse de l'article
//     const res = await fetch(url, {
//       signal: AbortSignal.timeout(10_000),
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
//         Accept:
//           "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
//         "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
//       },
//     });

//     const { document } = parseHTML(await res.text());
//     const dataF = await Defuddle(document, url, { markdown: true });

//     const truncated = dataF.content.slice(0, 3000);

//     // 2. Résumé via Cloudflare AI
//     const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
//     const CF_API_TOKEN = process.env.CF_API_TOKEN_CLOUDFLARE_AI;

//     const response = await fetch(
//       `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${CF_API_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           messages: [
//             {
//               role: "system",
//               content:
//                 "You are an assistant that summarizes technical articles. Respond with a clear and concise summary in 3 to 5 sentences in the same language as the article.",
//             },
//             {
//               role: "user",
//               content: `Titre: ${dataF.title}\nAuteur: ${dataF.author}\nDate: ${dataF.published}\n\nContenu:\n${truncated}`,
//             },
//           ],
//         }),
//       },
//     );

//     if (!response.ok) {
//       const err = await response.text();
//       console.error("Cloudflare error:", err);
//       return c.json({ error: "Erreur Cloudflare Workers AI" }, 502);
//     }

//     const data = await response.json();
//     console.log("CF raw response:", JSON.stringify(data));
//     const summary = data.result?.response;

//     return c.json({
//       title: dataF.title,
//       author: dataF.author,
//       date: dataF.published,
//       summary,
//     });
//   } catch (err) {
//     console.error("Error:", err);
//     return c.json({ error: "Erreur interne" }, 500);
//   }
// });

export default app;
