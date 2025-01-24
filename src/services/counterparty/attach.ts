import * as bitcoin from "bitcoinjs-lib";

import { apiLogger } from "@/utils/logger.ts";
import type { AttachParams, AttachResult } from "./attach.d.ts";
import { convertTxToPsbt } from "@/utils/btc/tx.ts";

import * as xcp from "@/utils/xcp/rpc.ts";

function checkAttachParams(params: AttachParams) {
    if (!params.asset) {
        throw new Error("Asset is required");
    }
    if (!params.address) {
        throw new Error("Address is required");
    }
    if (!params.quantity) {
        throw new Error("Quantity is required");
    }
    if (!params.feeRate) {
        throw new Error("Fee rate is required");
    }
}



export async function attach(params: AttachParams): Promise<AttachResult> {
    try {
        checkAttachParams(params);
        const result = await xcp.attachAssetToUTXO(params);
        const { rawtransaction } = result;
        const tx = bitcoin.Transaction.fromHex(rawtransaction);
        const { psbt, btc_in, btc_out, fee } = await convertTxToPsbt(tx);
        return {
            psbt: psbt.toHex(),
            btc_in,
            btc_out,
            fee,
        };
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}