-- Create the blocks table if not exists

CREATE TABLE IF NOT EXISTS blocks (
    block_height INTEGER PRIMARY KEY,
    block_hash TEXT NOT NULL,
    transactions TEXT
);

