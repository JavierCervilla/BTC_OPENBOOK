export interface XCPEvent {
    event_index: number
    event: string
    params: Params
    tx_hash: string
}

export interface Params {
    asset: string
    block_index: number
    destination: string
    msg_index: number
    quantity: number
    source: string
    status: string
    tx_hash: string
    tx_index: number
    block_time: number
    asset_info: AssetInfo
    quantity_normalized: string
}

export interface AssetInfo {
    asset_longname: string | null
    description: string
    issuer: string
    divisible: boolean
    locked: boolean
}

export interface XCPUtxoMoveInfo {
    txid: string
    timestamp: number
    seller: string
    buyer: string
    qty: bigint
    assetId: string
    openbook: boolean
}