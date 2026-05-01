import { Defuddle } from "defuddle/node";
import { Hono } from "hono";
import { parseHTML } from "linkedom";
import { GetContent } from "./actions/getContent.js";
import { db } from "./config/conn.js";
import {
  AIFactory,
  AIProvider,
} from "./infrastructure/summaryIA/ai-factory.js";
import { SummaryDocument } from "./infrastructure/summaryIA/summary-document.js";

const app = new Hono();

app.on(["POST"], "/summary", async (c) => {
  const { url } = await c.req.json();
  if (!url) {
    return c.json({ error: "id not found" });
  }
  const res = new GetContent(url);
  const content = await res.getOriginalContent();
  if (!content) {
    throw new Error("scrapping failed");
    return;
  }
  const provider = process.env.AI_PROVIDER as AIProvider;
  const AI = AIFactory.create(provider);
  const summary = await AI.summary(
    new SummaryDocument(
      content.title,
      content.author,
      content.date,
      content.content,
    ),
  );
  console.log(summary);

  const summaryText = summary.getResponse();

  // 2. Embedding du résumé
  const embeddingRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-m3`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN_CLOUDFLARE_AI}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: summaryText, // on embed le résumé, pas l'article brut
      }),
    },
  );

  const embeddingData = (await embeddingRes.json()) as {
    result: { data: number[][] };
  };
  const vector = embeddingData.result.data[0]; // tableau de ~384 floats

  console.log("summary:", summaryText);
  console.log("vector length:", vector.length);

  return c.json({
    summary: summaryText,
    embedding: vector,
  });
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
