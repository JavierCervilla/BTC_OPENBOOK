// migrateAddStatus.ts

import { Database } from "@db/sqlite";

const CONFIG = {
    DATABASE: {
        DB_NAME: "openbook.db",
    }
};

const db = new Database(CONFIG.DATABASE.DB_NAME);

db.exec("DROP TABLE IF EXISTS atomic_swaps");

db.exec(`
CREATE TABLE IF NOT EXISTS atomic_swaps (
    tx_index INTEGER PRIMARY KEY,
    txid TEXT,
    timestamp DATETIME,
    block_hash TEXT,
    block_index INTEGER,
    seller TEXT,
    buyer TEXT,
    utxo_balance TEXT,
    total_price BIGINT,
    unit_price BIGINT,
    service_fees TEXT
);`)
