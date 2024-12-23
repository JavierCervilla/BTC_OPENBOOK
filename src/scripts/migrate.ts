// migrateAddStatus.ts

import { Database } from "@db/sqlite";

const CONFIG = {
    DATABASE: {
        DB_NAME: "openbook.db",
    }
};

const db = new Database(CONFIG.DATABASE.DB_NAME);

db.exec("DROP TABLE IF EXISTS openbook_listings");

db.exec(`
CREATE TABLE IF NOT EXISTS openbook_listings (
    txid TEXT PRIMARY KEY,
    timestamp DATETIME,
    block_index INTEGER,
    utxo TEXT,
    price BIGINT,
    seller TEXT,
    psbt TEXT,
    utxo_balance TEXT,
    status TEXT CHECK(status IN ('active', 'inactive', 'pending')) DEFAULT 'active'
);`)
