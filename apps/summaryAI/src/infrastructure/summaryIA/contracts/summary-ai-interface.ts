import { SummaryResultInterface } from "./summary-result-interface.js";
import { SummaryDocument } from "../summary-document.js";

export abstract class SummaryAIInterface {
  abstract summary: (d: SummaryDocument) => Promise<SummaryResultInterface>;
}
