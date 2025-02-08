import * as bitcoin from 'bitcoinjs-lib'


import * as xcp from "@/utils/xcp/rpc.ts";
import type { SellOrderParams, SubmitSellOrderParams } from "./sell.d.ts";
import { apiLogger } from "@/utils/logger.ts";
import * as tx from "@/services/ordersbook/tx.ts";



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
        const psbt = await tx.createSellPSBT({
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

async function checkSubmitSellOrderParams(sellOrderParams: SubmitSellOrderParams) {
    const { utxo, seller, price, feeRate, psbt } = sellOrderParams;
    if (!utxo || !seller || !price || !feeRate || !psbt) {
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
    const signedPsbt = bitcoin.Psbt.fromHex(psbt);
    if (!tx.checkPSBTForSignatures(signedPsbt)) {
        throw new Error("PSBT doesnt contain any valid signatures");
    }

}

export async function submitSellOrder(submitOrderParams: SubmitSellOrderParams) {
    try {
        await checkSubmitSellOrderParams(submitOrderParams);
        const { psbt, seller, utxo, price, feeRate } = submitOrderParams;
        const signedPsbt = bitcoin.Psbt.fromHex(psbt);
        const partialSigs = tx.extractPartialSignatures(signedPsbt);
        const result = await tx.createListingTX({
            partialSigs,
            seller,
            utxo,
            price,
            feeRate,
        })

        return {
            psbt: result.psbt,
            btc_in: result.btcIn,
            btc_out: result.btcOut,
            change: result.change,
            vsize: result.vSize,
            fee: result.fee,
        };
    } catch(error) {
        apiLogger.error(error);
        throw error;
    }
}