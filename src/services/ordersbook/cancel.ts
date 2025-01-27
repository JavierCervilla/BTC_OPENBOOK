import { Database } from "@db/sqlite";
import * as bitcoin from "bitcoinjs-lib";

import type { createCancelProps } from "@/services/ordersbook/cancel.d.ts";

import * as rpc from "@/utils/btc/rpc.ts";
import * as tx from "@/utils/btc/tx.ts";
import { CONFIG } from "@/config/index.ts";
import { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";
import { hex2bin } from "@/utils/index.ts";
import { calculateTransactionSize } from "@/services/ordersbook/tx.ts";



function checkCreateCancelProps(createCancelProps: createCancelProps) {
    if (!createCancelProps.id) {
        throw new Error("Order id is required");
    }
    if (!createCancelProps.feeRate) {
        throw new Error("Fee rate is required");
    }
}

async function createCancelTx(utxo: string, seller: string, feeRate: number) {
    try {
        const psbt = new bitcoin.Psbt();
        const utxos = await rpc.getUTXO(seller);
        const [txid, vout] = utxo.split(":");

        const inputs2sign: Array<{ index: number; sighashType: number[] }> = [];
        const rawTx = await rpc.getTransaction(txid, false);
        psbt.addInput({
            hash: txid,
            index: Number(vout),
            nonWitnessUtxo: hex2bin(rawTx),
        })
        inputs2sign.push({
            index: Number(vout),
            sighashType: [bitcoin.Transaction.SIGHASH_ALL],
        });
        psbt.addOutput({
            address: seller,
            value: 546n,
        })

        const {
            expectedFee,
            baseSize,
            vSize,
        } = await calculateTransactionSize({
            seller: seller,
            p2wshCount: 0,
            feeRate: feeRate,
            op_return: Uint8Array.from([]),
            buyer: seller,
        });
        const requiredAmount = psbt.txOutputs.reduce((acc, output) => acc + output.value, 0n) + BigInt(expectedFee);
        const selectedUtxos = tx.selectUtxos(utxos, requiredAmount);
        let inputs = inputs2sign.length;
        for (const utxo of selectedUtxos) {
            const tx = await rpc.getTransaction(utxo.txid, false);
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: hex2bin(tx),
            });
            inputs2sign.push({
                index: inputs,
                sighashType: [bitcoin.Transaction.SIGHASH_ALL],
            });
            inputs++;
        }
        const btc_in = selectedUtxos.reduce((acc, input) => acc + BigInt(input.value), 0n);
        const btc_out = psbt.txOutputs.reduce((acc, output) => acc + output.value, 0n);
        const btc_change = btc_in - (btc_out + BigInt(expectedFee));
        if (btc_change < 0n) {
            throw new Error("Not enough funds");
        }
        if (btc_change > 456n) {
            psbt.addOutput({ address: seller, value: btc_change });
        }
        return { psbt: psbt.toHex(), inputsToSign: inputs2sign, fee: BigInt(expectedFee), btc_in, btc_out, btc_change, expectedFee, vSize, baseSize };
    } catch (_error) {
        throw new Error("Error creating cancel Transaction");
    }
}



export async function createCancel(createCancelProps: createCancelProps) {
    try {
        checkCreateCancelProps(createCancelProps);
        const db = new Database(CONFIG.DATABASE.DB_NAME, {
            readonly: true,
        });
        const query = "SELECT * FROM openbook_listings WHERE txid = ?";
        const result = await db.prepare(query).all(createCancelProps.id);
        if (result.length === 0) {
            throw new Error("Order not found");
        }
        const order = result[0] as OpenBookListing;

        const { utxo, seller } = order;
        const cancelTx = await createCancelTx(utxo, seller, createCancelProps.feeRate);
        return cancelTx;
    } catch (error) {
        throw new Error("Error creating cancel Transaction");
    }
}