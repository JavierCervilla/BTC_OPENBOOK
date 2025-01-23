import { Database } from "@db/sqlite";
import * as bitcoin from "bitcoinjs-lib";

import { CONFIG } from "@/config/index.ts";
import { apiLogger } from "@/utils/logger.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import * as tx from "@/utils/btc/tx.ts";
import type { createBuyProps, createBuyPSBTProps, FixedServiceFee, ServiceFee, CreateBuyPSBTResult } from "./buy.d.ts";
import { hex2bin } from "@/utils/hex.ts";
import type { inputToSign } from "@/services/ordersbook/tx.d.ts";
import type { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";
import { calculateTransactionSize } from "@/services/ordersbook/tx.ts";


async function addInputToPsbt(
    psbt: bitcoin.Psbt,
    utxo: { txid: string; vout: number },
    index: number,
    inputs2sign: Array<{ index: number; sighashType: number[] }>,
): Promise<void> {
    const tx = await rpc.getTransaction(utxo.txid, false);
    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: hex2bin(tx),
    });
    psbt.updateInput(index, {
        sighashType: bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    });
    inputs2sign.push({
        index,
        sighashType: [bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY],
    });
}

// Procesamos los UTXOs seleccionados
async function processSelectedUtxos(
    psbt: bitcoin.Psbt,
    selectedUtxos: Array<{ txid: string; vout: number }>,
    inputs2sign: Array<{ index: number; sighashType: number[] }>,
    sellerPsbt: bitcoin.Psbt,
): Promise<void> {
    if (selectedUtxos.length === 0) return;

    let inputsAdded = 0;
    for (const utxo of selectedUtxos) {
        await addInputToPsbt(psbt, utxo, inputsAdded, inputs2sign);
        inputsAdded++;

        psbt.addInput(sellerPsbt.txInputs[0]);
        if (inputsAdded === 1 && selectedUtxos.length > 1) {
            inputsAdded++;
        }
    }
}

export function calculateServiceFee(
    serviceFees: ServiceFee[],
    price: bigint
): FixedServiceFee[] {
    const formattedServiceFees: FixedServiceFee[] = [];

    for (const fee of serviceFees) {
        if ('percentage' in fee && 'threshold' in fee) {
            const percentage = Math.round(fee.percentage * 100); // Multiplicamos por 100 para manejar decimales si es necesario
            const calculatedAmount = Math.round((Number(price) * percentage) / 10000); 
            const amount = BigInt(Math.max(Number(calculatedAmount), fee.threshold));
            formattedServiceFees.push({
                concept: fee.concept,
                address: fee.address,
                amount: amount,
            });
        } else if ('amount' in fee) {
            formattedServiceFees.push({
                concept: fee.concept,
                address: fee.address,
                amount: BigInt(fee.amount),
            });
        }
    };

    return formattedServiceFees;
}

async function createBuyPSBT(prepare: createBuyPSBTProps): Promise<CreateBuyPSBTResult> {
    try {
        const psbt = new bitcoin.Psbt();
        const sellerPsbt = bitcoin.Psbt.fromHex(prepare.psbt);
        const utxos = await rpc.getUTXO(prepare.buyer);
        const formattedServiceFees = calculateServiceFee(prepare.serviceFee, BigInt(prepare.price));
        const requiredAmountForPriceAndFees = BigInt(prepare.price) + formattedServiceFees.reduce((acc: bigint, fee: FixedServiceFee) => acc + BigInt(fee.amount), 0n);

        psbt.addOutput({ address: prepare.buyer, value: 546n });

        for (const output of sellerPsbt.txOutputs) {
            psbt.addOutput(output);
        }

        const selectedUtxos = tx.selectUtxos(utxos, requiredAmountForPriceAndFees);
        const inputs2sign: inputToSign[] = [];

        await processSelectedUtxos(psbt, selectedUtxos, inputs2sign, sellerPsbt);
        for (const fee of formattedServiceFees) {
            psbt.addOutput({ address: fee.address, value: fee.amount });
        }
        const size = calculateTransactionSize(
            {
                seller: prepare.seller,
                p2wshCount: 0,
                feeRate: prepare.feeRate,
                op_return: Uint8Array.from([]),
                buyer: prepare.buyer
            }
        )
        const btc_in = selectedUtxos.reduce((acc, input) => acc + BigInt(input.value), 0n);
        const btc_out = psbt.txOutputs.reduce((acc, output) => acc + output.value, 0n);
        const btc_change = btc_in - (btc_out + BigInt(size.expectedFee));
        if (btc_change < 0n) {
            throw new Error("Not enough funds");
        }
        if (btc_change > 456n) {
            psbt.addOutput({ address: prepare.buyer, value: btc_change });
        }
        return { psbt: psbt.toHex(), inputsToSign: inputs2sign, fee: BigInt(size.expectedFee), btc_in, btc_out };
    } catch (error: unknown) {
        apiLogger.error(error);
        throw error;
    }
}


function checkCreateBuyProps(createBuyProps: createBuyProps) {
    if (!createBuyProps.id) {
        throw new Error("Id is required");
    }
    if (!createBuyProps.buyer) {
        throw new Error("Buyer is required");
    }
}

export async function createBuy(createBuyProps: createBuyProps) {
    try {
        checkCreateBuyProps(createBuyProps);
        const db = new Database(CONFIG.DATABASE.DB_NAME, {
            readonly: true,
        });
        const query = "SELECT * FROM openbook_listings WHERE txid = ?";
        const result = await db.prepare(query).all(createBuyProps.id);
        if (result.length === 0) {
            throw new Error("Order not found");
        }
        const order = result[0] as OpenBookListing;
        const prepare: createBuyPSBTProps = {
            buyer: createBuyProps.buyer,
            serviceFee: createBuyProps.serviceFee,
            feeRate: createBuyProps.feeRate,
            ...order,
        }
        const buyPsbtResult = await createBuyPSBT(prepare);
        return {
            psbt: buyPsbtResult.psbt,
            inputsToSign: buyPsbtResult.inputsToSign,
            fee: buyPsbtResult.fee,
            btc_in: buyPsbtResult.btc_in,
            btc_out: buyPsbtResult.btc_out,
        };
    } catch (error: unknown) {
        apiLogger.error(error);
        throw error;
    }
}