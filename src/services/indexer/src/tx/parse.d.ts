export type ParsedTransaction = {
    txid: string,
    protocol: number,
    assetId: string,
    qty: bigint,
    seller: string,
    buyer: string,
    total_price: bigint,
    unit_price: bigint,
    timestamp: number,
    block_index: number,
    block_hash: string,
}