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

export interface SubmitSellOrderParams extends SellOrderParams {
    psbt: string;
    feeRate: number;
}