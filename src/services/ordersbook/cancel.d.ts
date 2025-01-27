import type { inputToSign } from "@/services/ordersbook/tx.d.ts";

export type createCancelProps = {
    id: string;
    feeRate: number;
}

export interface CreateCancelResult {
    psbt: string,
    inputsToSign: inputToSign[],
    fee: bigint,
    btc_in: bigint,
    btc_out: bigint,
    expectedFee: number,
    vSize: number,
    baseSize: number,
}