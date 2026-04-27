import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";

export class Scrapping {
  static async parseDoc(str: string, url: string) {
    const { document } = parseHTML(str);
    return await Defuddle(document, url, { markdown: true });
  }
}
