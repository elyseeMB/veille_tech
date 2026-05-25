import Dexie, { type Table } from 'dexie'

export interface Click {
    id?: number
    articleId: string
    title: string
    url: string
    source?: string
    sourceBaseUrl?: string
    clickedAt: string
}

class HistoryDB extends Dexie {
    clicks!: Table<Click>

    constructor() {
        super('veille-history')
        this.version(1).stores({
            clicks: '++id, articleId, clickedAt'
        })
    }
}

export const db = new HistoryDB()
