// lib/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Click {
  id?: number;
  articleId: string;
  title: string;
  url: string;
  source?: string;
  sourceBaseUrl?: string;
  clickedAt: string;
}

interface VeilleDB extends DBSchema {
  clicks: {
    key: number;
    value: Click;
    indexes: { articleId: string; clickedAt: string };
  };
}

class HistoryDB {
  private dbPromise: Promise<IDBPDatabase<VeilleDB>>;

  constructor() {
    this.dbPromise = openDB<VeilleDB>("veille-history", 1, {
      upgrade(db) {
        const store = db.createObjectStore("clicks", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("articleId", "articleId");
        store.createIndex("clickedAt", "clickedAt");
      },
    });
  }

  private get db() {
    return this.dbPromise;
  }

  async addClick(click: Click) {
    const db = await this.db;
    return db.add("clicks", click);
  }

  async getRecentClicks(limit = 50): Promise<Click[]> {
    const db = await this.db;
    const tx = db.transaction("clicks", "readonly");
    const index = tx.store.index("clickedAt");
    const results: Click[] = [];

    let cursor = await index.openCursor(null, "prev");
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return results;
  }

  async getAllArticleIds(): Promise<Set<string>> {
    const db = await this.db;
    const all = await db.getAllFromIndex("clicks", "articleId");
    return new Set(all.map((click) => click.articleId));
  }

  async clearClicks() {
    const db = await this.db;
    return db.clear("clicks");
  }
}

export const db = new HistoryDB();
