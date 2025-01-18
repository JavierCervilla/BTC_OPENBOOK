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

const INDEXER_CONFIG = () => ({
    LOGS_FILE: Deno.env.get("INDEXER_LOGS_PATH") ?? "./logs/indexer.log.txt",
    START_BLOCK: 280330, // FIRST COUNTERPARTY BLOCK
    //START_BLOCK: 866000, // FIRST BLOCK WITH ACTIVE CHANGE FOR ATOMIC SWAPS
    //START_BLOCK: 868136, // MULTIPLE ATOMIC SWAPS IN SAME TX
    //START_BLOCK: 867501, // FIRST ATOMIC SWAP IN FIREMINTS
    //START_BLOCK: 866942, // FIRST ATOMIC SWAP
    START_UTXO_MOVE_BLOCK: 866000,
    //START_OPENBOOK_LISTINGS_BLOCK: 875332, // FIRST BLOCK WITH OPEN BOOK LISTINGS
    START_OPENBOOK_LISTINGS_BLOCK: 9999999, // FIRST BLOCK WITH OPEN BOOK LISTINGS

});

const DATABASE_CONFIG = () => ({
    DB_NAME: Deno.env.get("DATABASE_NAME") ?? "openbook.db",
    SCHEMA_PATH: "schema.sql",
});

const BITCOIN_CONFIG = () => ({
    MAINNET: {
        RPC_URL: Deno.env.get("BITCOIN_RPC_URL") ?? "https://bitcoin-rpc.publicnode.com",
        RPC_USER: Deno.env.get("BITCOIN_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("BITCOIN_RPC_PASSWORD") ?? "rpc",
    },
    TESTNET: {
        RPC_URL: Deno.env.get("BITCOIN_TESTNET_RPC_URL") ?? "https://bitcoin-testnet-rpc.publicnode.com",
        RPC_USER: Deno.env.get("BITCOIN_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("BITCOIN_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
});
/*
public nodes taken from here:
[list of nodes](https://github.com/spesmilo/electrum/blob/afa1a4d22a31d23d088c6670e1588eed32f7114d/lib/network.py#L57)
*/
const ELECTRUM_CONFIG = () => ({
    MAINNET: {
        RPC_URL: Deno.env.get("ELECTRUM_RPC_URL") ?? "https://erbium1.sytes.net:51002",
        RPC_USER: Deno.env.get("ELECTRUM_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("ELECTRUM_RPC_PASSWORD") ?? "rpc",
    },
    TESTNET: {
        RPC_URL: Deno.env.get("ELECTRUM_TESTNET_RPC_URL") ?? "https://testnetnode.arihanc.com:51002",
        RPC_USER: Deno.env.get("ELECTRUM_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("ELECTRUM_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
});

const XCP_CONFIG = () => ({
    MAINNET: {
        RPC_URL: Deno.env.get("XCP_RPC_URL") ?? "https://api.counterparty.io:4000",
        RPC_USER: Deno.env.get("XCP_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("XCP_RPC_PASSWORD") ?? "rpc",
    },
    TESTNET: {
        RPC_URL: Deno.env.get("XCP_TESTNET_RPC_URL") ?? "https://api.counterparty.io:14000",
        RPC_USER: Deno.env.get("XCP_TESTNET_RPC_USER") ?? "rpc",
        RPC_PASSWORD: Deno.env.get("XCP_TESTNET_RPC_PASSWORD") ?? "rpc",
    }
});

const API_CONFIG = () => ({
    PORT: Deno.env.get("API_PORT") ?? 3001,
    LOGS_FILE: Deno.env.get("API_LOGS_PATH") ?? "./logs/api.log.txt",
});

type NetworkType = 'MAINNET' | 'TESTNET';
const NETWORK = () => (Deno.env.get("NETWORK") ?? "MAINNET") as NetworkType;

const TESTING_CONFIG = () => ({
    WIF: Deno.env.get("TESTING_WIF") ?? ""
});



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
    TESTING: TESTING_CONFIG()
}