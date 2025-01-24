import type { UTXOBalance } from "@/services/indexer/src/tx/parse.d.ts";
import type { inputToSign } from "@/services/ordersbook/tx.d.ts";

export interface createBuyProps {
    buyer: string;
    id: string;
    feeRate: number;
    serviceFee: ServiceFee[];
}

export interface createBuyPSBTProps {
    buyer: string;
    txid: string;
    block_index: number;
    utxo: string;
    price: bigint;
    seller: string;
    psbt: string;
    utxo_balance: string | UTXOBalance[],
    status?: string;
    serviceFee: ServiceFee[];
    feeRate: number;
}

export type ServiceFee = FixedServiceFee | PercentageServiceFee;

export type FixedServiceFee = {
    concept?: string;
    address: string;
    amount: bigint;
} 

export type PercentageServiceFee = {
    concept: string;
    address: string;
    percentage: number;
    threshold: number;
}

export interface CreateBuyPSBTResult {
    psbt: string,
    inputsToSign: inputToSign[],
    fee: bigint,
    btc_in: bigint,
    btc_out: bigint,
    
    expectedFee: number,
    baseSize: number,
    vSize: number,
}