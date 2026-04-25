import { Hono } from "hono";
import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const app = new Hono();

const bedrock = new BedrockRuntimeClient({
  region: "us-east-1",
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10_000,
  }),
});

async function summarize(content: string): Promise<string> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Tu es un assistant de veille technologique. Résume cet article en français en 3-4 phrases claires et concises. Garde uniquement les informations essentielles.\n\n${content}`,
          },
        ],
      }),
    }),
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

app.get("/", (c) => c.text("Hello Hono!"));

app.get("/text", async (c) => {
  const url =
    "https://arstechnica.com/gadgets/2026/04/samsung-may-be-bracing-for-first-ever-annual-loss-in-smartphone-business/";

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
    });

    const { document } = parseHTML(await res.text());
    const data = await Defuddle(document, url, { markdown: true });

    const summary = await summarize(data.content);

    return c.json({
      title: data.title,
      author: data.author,
      date: data.published,
      summary,
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: String(error) });
  }
});

export default app;
