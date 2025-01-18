export type UTXOBalance = {
    assetId: string,
    qty: bigint,
    protocol: number,
    protocol_name: string
}

export type ParsedTransaction = {
    txid: string,
    protocol: number,
    utxo_balance: UTXOBalance[],
    seller: string,
    buyer: string,
    total_price: bigint,
    unit_price: bigint,
    timestamp: Date | string,
    block_index?: number,
    block_hash?: string,
    service_fees: { address: string, fee: bigint }[]
}
export type AtomicSwap = ParsedTransaction;

export type OpenBookListing = {
    txid: string,
    timestamp: number,
    block_index: number,
    utxo: string,
    price: bigint,
    seller: string,
    psbt: string,
    utxo_balance: string | UTXOBalance[],
    status?: string,
}