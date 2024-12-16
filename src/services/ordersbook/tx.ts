import * as bitcoin from "bitcoinjs-lib";
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

const ECPair = ECPairFactory(ecc);

import { hex2bin } from "@/utils/hex.ts";
import * as btc from "@/utils/btc/rpc.ts";
import { apiLogger } from "@/utils/logger.ts";
import type { SellOrderParams } from "./sell.d.ts";
import type { inputToSign, partialSignature } from "@/services/ordersbook/tx.d.ts";


export async function createSellTx(sellOrderParams: SellOrderParams) {
    try {
        const { utxo, seller, price } = sellOrderParams;
        const [utxoTxId, utxoVout] = utxo.split(":");
        const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

        const utxoRawTx = await btc.getTransaction(utxoTxId, false);
        if (!utxoRawTx) {
            throw new Error("UTXO doesnt exist");
        }
        psbt.addInput({
            hash: hex2bin(utxoTxId).reverse(),
            index: Number.parseInt(utxoVout),
            nonWitnessUtxo: hex2bin(utxoRawTx),
        });
        psbt.updateInput(
            0,
            { sighashType: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY }
        )
        psbt.addOutput({
            address: seller,
            value: BigInt(price),
        });
        return psbt;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}

export function extractPartialSignatures(psbt: bitcoin.Psbt) {
    const partialSignatures = [];
    for (const [index, input] of psbt.data.inputs.entries()) {
        if (input?.partialSig) {
            partialSignatures.push({ index, partialSig: input?.partialSig });
        }
    }
    return partialSignatures;
}

export function signPsbt({ psbt, inputsToSign, wif }: { psbt: bitcoin.Psbt, inputsToSign: inputToSign[], wif: string }) {
    try {
        const keyPair = ECPair.fromWIF(wif, bitcoin.networks.bitcoin);

        for (const input of inputsToSign) {
            psbt.signInput(input.index, keyPair, input.sighashType);
            psbt.validateSignaturesOfInput(input.index, (pubkey, msghash, signature) => {
                return ecc.verify(msghash, pubkey, signature);
            });
        }
        return psbt;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}

export function reconstructTxFromPartialSigs({ partialSigs, psbt }: { partialSigs: partialSignature[], psbt: bitcoin.Psbt }) {
    try {
        for (const partialSig of partialSigs) {
            psbt.updateInput(partialSig.index, {
                partialSig: partialSig.partialSig
            });
        }
        return psbt;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}