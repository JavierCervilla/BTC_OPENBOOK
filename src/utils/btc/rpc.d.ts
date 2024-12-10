type JSONRPC = {
    jsonrpc: string,
    id: number,
    method: string,
    params: unknown[]
}

type rpcCall = {
    rpcUser: string,
    rpcPassword: string,
    endpoint: string,
    call: JSONRPC
}

type VIN = {
    txid: string,
    vout: number,
    scriptSig: {
        asm: string,
        hex: string,
    },
    txinwitness: string[],
    sequence: number,
}

type VOUT = {
    value: number,
    n: number,
    scriptPubKey: {
        asm: string,
        desc: string,
        hex: string,
        address: string,
        type: string,
    },
}

type Transaction = {
    txid: string,
    hash: string,
    version: number,
    size: number,
    vsize: number,
    weight: number,
    locktime: number,
    vin: VIN[],
    vout: VOUT[],
};

type Block = {
    hash: string,
    confirmations: number,
    height: number,
    version: number,
    versionHex: string,
    merkleRoot: string,
    time: number,
    mediantime: number,
    nonce: number,
    bits: string,
    difficulty: number,
    chainwork: string,
    nTx: number,
    previousblockhash: string,
    nextblockhash: string,
    strippedsize: number,
    size: number,
    weight: number,
    tx: Transaction[],
}