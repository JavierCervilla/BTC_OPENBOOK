export type ParsedTransaction = {
    txid: string,
    protocol: number,
    assetId: string,
    qty: bigint | number,
    seller: string,
    buyer: string,
    total_price: bigint,
    unit_price: bigint,
    timestamp: number,
    block_index: number,
    block_hash: string,
    service_fee_recipient: string | null,
    service_fee: bigint | null,
}
export type AtomicSwap = ParsedTransaction;