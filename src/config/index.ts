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
    START_BLOCK: 866000,
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
}