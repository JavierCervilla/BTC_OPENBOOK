import * as bitcoin from "bitcoinjs-lib";
import { createHash } from "node:crypto"

import * as hex from "@/utils/hex.ts";

export function sha256(data: string | Uint8Array) {
    return createHash('sha256').update(data).digest('hex');
}

export function address2ScriptHash(address: string) {
    const script = bitcoin.address.toOutputScript(address);
    const hash = sha256(script);
    const reversed = hex.hex2bin(hash).reverse();
    return hex.bin2hex(reversed);
}

export function calculateTxSize({
    nInputsLegacy,
    nInputsSegWit,
    nOutputsP2PKH,
    nOutputsP2WSH,
    feeRate,
    op_return_size
}: { nInputsLegacy: number, nInputsSegWit: number, nOutputsP2PKH: number, nOutputsP2WSH: number, feeRate: number, op_return_size: number }) {
    const HEADER_SIZE = 10; // Version + Locktime

    // Legacy Inputs
    const LEGACY_INPUT_SIZE = 148; // Tamaño promedio de un input Legacy
    const BASE_INPUT_LEGACY = nInputsLegacy * LEGACY_INPUT_SIZE;

    // SegWit Inputs (sin witness)
    const SEGWIT_INPUT_SIZE = 41; // Tamaño promedio de un input SegWit (base)
    const BASE_INPUT_SEGWIT = nInputsSegWit * SEGWIT_INPUT_SIZE;

    // Witness data for SegWit Inputs
    const SEGWIT_WITNESS_SIZE = 108; // Witness promedio para un input SegWit
    const WITNESS_WEIGHT = nInputsSegWit * SEGWIT_WITNESS_SIZE;

    // Outputs
    const P2PKH_OUTPUT_SIZE = 33; // Tamaño promedio de un output P2PKH
    const BASE_OUTPUT_P2PKH = nOutputsP2PKH * P2PKH_OUTPUT_SIZE;

    const P2WSH_OUTPUT_SIZE = 43; // Tamaño promedio de un output P2WSH
    const BASE_OUTPUT_P2WSH = nOutputsP2WSH * P2WSH_OUTPUT_SIZE;
    // Base weight (sin witness)
    const baseWeight =
        HEADER_SIZE * 4 +
        BASE_INPUT_LEGACY * 4 +
        BASE_INPUT_SEGWIT * 4 +
        BASE_OUTPUT_P2PKH * 4 +
        BASE_OUTPUT_P2WSH * 4 +
        op_return_size * 2;

    // Total weight
    const totalWeight = baseWeight + WITNESS_WEIGHT;

    // Virtual size (vBytes)
    const vSize = Math.ceil(totalWeight / 4);

    // Expected fee
    const expectedFee = vSize * feeRate;

    return { baseWeight, witnessWeight: WITNESS_WEIGHT, totalWeight, vSize, expectedFee };
}

export function selectUtxos(utxos: UTXO[], requiredAmount: bigint, dustThreshold = 546n): UTXO[] {
    const selectedUtxos: UTXO[] = [];
    let accumulatedValue = 0n;

    for (const utxo of utxos) {
        if (utxo.value >= requiredAmount) {
            return [utxo];
        }

        if (utxo.value > dustThreshold) {
            selectedUtxos.push(utxo);
            accumulatedValue += BigInt(utxo.value);

            if (accumulatedValue >= requiredAmount) {
                return selectedUtxos;
            }
        }
    }

    throw new Error("Error: Not enough UTXOs to cover the required amount.");
}