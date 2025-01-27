import "jsr:@std/dotenv/load";

const VERSION_CONFIG = () => {
    const MAJOR = 0;
    const MINOR = 0;
    const PATCH = 0;
    return {
        MAJOR,
        MINOR,
        PATCH,
        STRING: `${MAJOR}.${MINOR}.${PATCH}`
    };
};

const OPENBOOK_PROTOCOL_CONFIG = () => {
    const MAJOR = 0;
    const MINOR = 0;
    const PATCH = 0;

    return {
        PREFIX: "OB",
        TIMELOCK: 888,
        VERSION: {
            MAJOR,
            MINOR,
            PATCH,
            STRING: `${MAJOR}.${MINOR}.${PATCH}`
        },
        0: {
            name: "XCP",
            asset_id_bytes: 20,
            divisible_bytes: 1,
            index_bytes: 0,
        },
        1: {
            name: "ORDINALS",
            asset_id_bytes: 64,
            index_bytes: 1,
        }
    }
};

const INDEXER_CONFIG = () => {

    const LOGS_FILE = Deno.env.get("INDEXER_LOGS_PATH") ?? "./logs/indexer.log.txt";
    const START_BLOCK = 280330 // FIRST COUNTERPARTY BLOCK
    const START_UTXO_MOVE_BLOCK = 866000 // FIRST BLOCK WITH ACTIVE CHANGE FOR ATOMIC SWAPS
    const START_OPENBOOK_LISTINGS_BLOCK = 875332 // FIRST BLOCK WITH OPEN BOOK LISTINGS
    return { LOGS_FILE, START_BLOCK, START_UTXO_MOVE_BLOCK, START_OPENBOOK_LISTINGS_BLOCK };
}

const DATABASE_CONFIG = () => {
    const DB_NAME = Deno.env.get("DATABASE_NAME") ?? "openbook.db";
    const SCHEMA_PATH = "schema.sql";
    return { DB_NAME, SCHEMA_PATH };
};

const BITCOIN_CONFIG = () => {
    const MAINNET = {
        RPC_URL: Deno.env.get("BITCOIN_RPC_URL") ?? "https://bitcoin-rpc.publicnode.com",
        RPC_USER: Deno.env.get("BITCOIN_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("BITCOIN_RPC_PASSWORD") ?? "rpc",
        ZMQ_URL: Deno.env.get("BITCOIN_ZMQ_URL") ?? "tcp://127.0.0.1:19333",
    };
    const TESTNET= {
        RPC_URL: Deno.env.get("BITCOIN_TESTNET_RPC_URL") ?? "https://bitcoin-testnet-rpc.publicnode.com",
        RPC_USER: Deno.env.get("BITCOIN_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("BITCOIN_TESTNET_RPC_PASSWORD") ?? "rpc",
        ZMQ_URL: Deno.env.get("BITCOIN_ZMQ_URL") ?? "tcp://127.0.0.1:19333",
    };
    return { MAINNET, TESTNET };
};
/*
public nodes taken from here:
[list of nodes](https://github.com/spesmilo/electrum/blob/afa1a4d22a31d23d088c6670e1588eed32f7114d/lib/network.py#L57)
*/
const ELECTRUM_CONFIG = () => {
    const MAINNET= {
        RPC_URL: Deno.env.get("ELECTRUM_RPC_URL") ?? "https://mempool.space:50002",
        RPC_USER: Deno.env.get("ELECTRUM_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("ELECTRUM_RPC_PASSWORD") ?? "rpc",
    };
    const TESTNET = {
        RPC_URL: Deno.env.get("ELECTRUM_TESTNET_RPC_URL") ?? "https://mempool.space:40002",
        RPC_USER: Deno.env.get("ELECTRUM_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("ELECTRUM_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
    return { MAINNET, TESTNET };
};

const XCP_CONFIG = () => {
    const MAINNET = {
        RPC_URL: Deno.env.get("XCP_RPC_URL") ?? "https://api.counterparty.io:4000",
        RPC_USER: Deno.env.get("XCP_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("XCP_RPC_PASSWORD") ?? "rpc",
    }
    const TESTNET = {
        RPC_URL: Deno.env.get("XCP_TESTNET_RPC_URL") ?? "https://api.counterparty.io:14000",
        RPC_USER: Deno.env.get("XCP_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("XCP_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
    return { MAINNET, TESTNET };
};

const API_CONFIG = () => {
    const PORT = Deno.env.get("API_PORT") ?? 3001;
    const LOGS_FILE = Deno.env.get("API_LOGS_PATH") ?? "./logs/api.log.txt";
    return { PORT, LOGS_FILE };
}

const CRON_CONFIG = () => {
    const CHECK_ORDERS_CRON = Deno.env.get("CHECK_ORDERS_CRON") ?? "*/5 * * * *";
    const LOGS_FILE = Deno.env.get("CRON_LOGS_PATH") ?? "./logs/cron.log.txt";
    return { CHECK_ORDERS_CRON, LOGS_FILE };
}

type NetworkType = 'MAINNET' | 'TESTNET';
const NETWORK = () => (Deno.env.get("NETWORK") ?? "MAINNET") as NetworkType;

const TESTING_CONFIG = () => {
    const WIF = Deno.env.get("TESTING_WIF") ?? "";
    return { WIF };
}

const NODE_ENV = () => (Deno.env.get("NODE_ENV") ?? "development") as "development" | "production" | "testing";

const DEBUG = () => {
    const ACTIVE = Deno.env.get("DEBUG") === "true";
    const LOGS_FILE = "./logs/debug.log.txt";
    return { ACTIVE, LOGS_FILE };
}

const PARTNERS_CONFIG = () => {
    const HEADER_NAME = "x-api-key";
    const CONFIG_PATH = Deno.env.get("PARTNERS_CONFIG_PATH") ?? "./partners/config.json";
    const CONFIG = JSON.parse(Deno.readTextFileSync(CONFIG_PATH));
    return { HEADER_NAME, CONFIG_PATH, CONFIG };
}

export const CONFIG = {
    VERSION: VERSION_CONFIG(),
    NETWORK: NETWORK(),
    INDEXER: INDEXER_CONFIG(),
    OPENBOOK: OPENBOOK_PROTOCOL_CONFIG(),
    DATABASE: DATABASE_CONFIG(),
    BITCOIN: BITCOIN_CONFIG()[NETWORK()],
    ELECTRUM: ELECTRUM_CONFIG()[NETWORK()],
    XCP: XCP_CONFIG()[NETWORK()],
    API: API_CONFIG(),
    CRON: CRON_CONFIG(),
    TESTING: TESTING_CONFIG(),
    NODE_ENV: NODE_ENV(),
    PARTNERS: PARTNERS_CONFIG(),
    DEBUG: DEBUG()
}