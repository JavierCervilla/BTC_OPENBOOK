export type { DetachParams } from "@/utils/xcp/rpc.d.ts";

export interface DetachResult {
    psbt: string;
    btc_in: bigint;
    btc_out: bigint;
    fee: bigint;
}