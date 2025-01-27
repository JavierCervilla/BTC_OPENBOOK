import { apiLogger } from "@/utils/logger.ts";


import * as xcp from "@/utils/xcp/rpc.ts";
import { DetachParams, DetachResult } from "@/services/counterparty/detach.d.ts";
import * as  bitcoin from "bitcoinjs-lib";
import { convertTxToPsbt } from "@/utils/btc/tx.ts";

function checkDetachParams(params: DetachParams) {
    if (!params.utxo) {
        throw new Error("UTXO is required");
    }
    if (!params.address) {
        throw new Error("Address is required");
    }
    if (!params.feeRate) {
        throw new Error("Fee rate is required");
    }
}



export async function detach(params: DetachParams): Promise<DetachResult> {
    try {
        checkDetachParams(params);
        const result = await xcp.detachAssetFromUTXO(params);
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