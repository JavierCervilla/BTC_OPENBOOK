import type { UTXOBalance } from "@/services/indexer/src/tx/parse.d.ts";

export interface createBuyProps {
    buyer: string;
    id: string;
    feeRate: number;
    serviceFee: { address: string, amount: bigint }[];
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
    serviceFee: { address: string, amount: bigint }[];
    feeRate: number;
}