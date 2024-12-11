import "jsr:@std/dotenv/load";

const OPENBOOK_PROTOCOL_CONFIG = {
    PREFIX: "OB",
    VERSIONS: {
        0: {
            TIMELOCK: 800,
        }
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
};

const INDEXER_CONFIG = {
    LOGS_FILE: "./logs/indexer.log.txt",
    //START_BLOCK: 866000, // FIRST BLOCK WITH ACTIVE CHANGE FOR ATOMIC SWAPS
    //START_BLOCK: 868136, // MULTIPLE ATOMIC SWAPS IN SAME TX
    //START_BLOCK: 867501, // FIRST ATOMIC SWAP IN FIREMINTS
    START_BLOCK: 866942, // FIRST ATOMIC SWAP
    START_OPENBOOK_LISTINGS_BLOCK: 999999, // FIRST BLOCK WITH OPEN BOOK LISTINGS
};

const DATABASE_CONFIG = {
    DB_NAME: "openbook.db",
    SCHEMA_PATH: "schema.sql",
}

const BITCOIN_CONFIG = {
    MAINNET: {
        RPC_URL: Deno.env.get("BITCOIN_RPC_URL") ??  "https://bitcoin-rpc.publicnode.com",
        RPC_USER: Deno.env.get("BITCOIN_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("BITCOIN_RPC_PASSWORD") ?? "rpc",
    },
    TESTNET: {
        RPC_URL: Deno.env.get("BITCOIN_TESTNET_RPC_URL") ?? "https://bitcoin-testnet-rpc.publicnode.com",
        RPC_USER: Deno.env.get("BITCOIN_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("BITCOIN_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
}

const XCP_CONFIG = {
    MAINNET: {
        RPC_URL: Deno.env.get("XCP_MAINNET_RPC_URL") ?? "https://api.counterparty.io:4000",
        RPC_USER: Deno.env.get("XCP_MAINNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("XCP_MAINNET_RPC_PASSWORD") ?? "rpc",
    },
    TESTNET: {
        RPC_URL: Deno.env.get("XCP_TESTNET_RPC_URL") ?? "https://api.counterparty.io:14000",
        RPC_USER: Deno.env.get("XCP_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("XCP_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
}

const API_CONFIG = {
    PORT: Deno.env.get("API_PORT") ?? 3001,
    LOGS_FILE: "./logs/api.log.txt",
}

type NetworkType = 'MAINNET' | 'TESTNET';
const NETWORK = (Deno.env.get("NETWORK") ?? "MAINNET") as NetworkType;


export const CONFIG = {
    VERSION: {
        MAJOR: 0,
        MINOR: 0,
        PATCH: 0,
    },
    NETWORK: NETWORK,
    INDEXER: INDEXER_CONFIG,
    OPENBOOK: OPENBOOK_PROTOCOL_CONFIG,
    DATABASE: DATABASE_CONFIG,
    BITCOIN: BITCOIN_CONFIG[NETWORK],
    XCP: XCP_CONFIG[NETWORK],
    API: API_CONFIG
}