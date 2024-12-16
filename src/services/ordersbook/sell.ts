import * as bitcoin from 'bitcoinjs-lib'


import * as xcp from "@/utils/xcp/rpc.ts";
import type { SellOrderParams } from "./sell.d.ts";
import { apiLogger } from "@/utils/logger.ts";
import { createSellTx } from "@/services/ordersbook/tx.ts";



async function checkSellOrderParams(sellOrderParams: SellOrderParams) {
    const { utxo, seller, price } = sellOrderParams;
    if (!utxo || !seller || !price) {
        throw new Error("Invalid sell order params");
    }
    const [utxoTxId, utxoVout] = utxo.split(":");
    if (!utxoTxId || !utxoVout) {
        throw new Error("Invalid utxo format");
    }
    const utxoBalance = await xcp.getUTXOBalance(utxo);
    if (utxoBalance.length === 0) {
        throw new Error("UTXO doesnt contain any balance");
    }
}

export async function createSellOrderPsbt(sellOrderParams: SellOrderParams) {
    try {
        await checkSellOrderParams(sellOrderParams);
        const { utxo, seller, price } = sellOrderParams;
        const psbt = await createSellTx({
            utxo,
            seller,
            price,
        })
        return {
            psbt: psbt.toHex(),
            utxo: utxo,
            seller: seller,
            price: price,
        };
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}