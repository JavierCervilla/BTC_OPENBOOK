-- Create the blocks table if not exists

CREATE TABLE IF NOT EXISTS blocks (
    block_index INTEGER PRIMARY KEY,
    block_hash TEXT NOT NULL,
    transactions BLOB,
    block_time DATETIME
);

-- Create the atomic_swaps table if not exists
CREATE TABLE IF NOT EXISTS atomic_swaps (
    txid TEXT PRIMARY KEY,
    timestamp DATETIME,
    block_hash TEXT,
    block_index INTEGER,
    seller TEXT,
    buyer TEXT,
    protocol TEXT,
    assetId TEXT,
    qty BIGINT,
    total_price BIGINT,
    unit_price BIGINT
);
