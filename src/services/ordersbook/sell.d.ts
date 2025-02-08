interface SellOrderParams {
    utxo: string;
    seller: string;
    price: number;
}

export interface CreateSellOrderResult {
    psbt: string;
    utxo: string;
    seller: string;
    price: number;
}

export interface SubmitSellOrderResult {
    psbt: string;
    btc_in: bigint;
    btc_out: bigint;
    change: bigint;
    vsize: number;
    fee: number;
}

export interface SubmitSellOrderParams extends SellOrderParams {
    psbt: string;
    feeRate: number;
}

