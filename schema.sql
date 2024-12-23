-- Create the blocks table if not exists

CREATE TABLE IF NOT EXISTS blocks (
    block_index INTEGER PRIMARY KEY,
    transactions TEXT,
    events TEXT,
    block_time DATETIME
);

-- Create the atomic_swaps table if not exists

CREATE TABLE IF NOT EXISTS atomic_swaps (
    tx_index INTEGER PRIMARY KEY,
    txid TEXT,
    timestamp DATETIME,
    block_hash TEXT,
    block_index INTEGER,
    seller TEXT,
    buyer TEXT,
    protocol TEXT,
    assetId TEXT,
    qty BIGINT,
    total_price BIGINT,
    unit_price BIGINT,
    service_fee_recipient TEXT,
    service_fee BIGINT
    --- openbook BOOLEAN
);

-- Create the openbook_listings table if not exists

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
);
