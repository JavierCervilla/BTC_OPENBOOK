export type { AttachParams } from "@/utils/xcp/rpc.d.ts";

export interface AttachResult {
    psbt: string;
    btc_in: bigint;
    btc_out: bigint;
    fee: bigint;
}