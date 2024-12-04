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
};



export const CONFIG = {
    VERSION: {
        MAJOR: 0,
        MINOR: 0,
        PATCH: 0,
    },
    INDEXER: INDEXER_CONFIG,
    OPENBOOK: OPENBOOK_PROTOCOL_CONFIG,
}