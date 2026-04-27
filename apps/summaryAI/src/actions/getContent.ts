import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";
import { Scrapping } from "../services/scrapping.js";

export class GetContent {
  #header = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
  };

  #url: string | undefined;

  constructor(url: string | undefined) {
    if (!url) {
      return;
    }
    this.#url = url;
  }

  async getOriginalContent() {
    if (!this.#url) {
      return;
    }
    const res = await fetch(this.#url, {
      signal: AbortSignal.timeout(10_000),
      headers: this.#header,
    });
    const text = await res.text();
    const data = await Scrapping.parseDoc(text, this.#url);
    return {
      title: data.title,
      author: data.author,
      date: data.published,
      content: data.content,
    };
  }
}
