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
    tx: Transaction[] | string[],
}

type UTXO = {
    txid: string;
    vout: number;
    status: {
        confirmed: boolean;
        block_height: number;
    },
    value: number;
    height: number;
    balance?: boolean;
    utxo_balance?:unknown;
}

type ElectrsUTXO = {
    height: number
    tx_hash: string,
    tx_pos: number,
    value: number,
}

type WSMessage = {
    block?: BlockMessage
}

type BlockMessage = {
    height: number;
};

interface WebSocketCallbacks {
    onMessage: (message: WSMessage) => void | Promise<void>;
    onConnect: () => void | Promise<void>;
    onError: (error: Event | ErrorEvent) => void | Promise<void>;
    onClose: () => void | Promise<void>;
}