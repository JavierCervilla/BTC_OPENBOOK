import * as bitcoin from "bitcoinjs-lib";
import { createHash } from "node:crypto"

import * as hex from "@/utils/hex.ts";
import type { UTXO } from "./rpc.d.ts";

export function sha256(data: string | Uint8Array) {
    return createHash('sha256').update(data).digest('hex');
}

export function address2ScriptHash(address: string) {
    const script = bitcoin.address.toOutputScript(address);
    const hash = sha256(script);
    const reversed = hex.hex2bin(hash).reverse();
    return hex.bin2hex(reversed);
}

export function calculateSigOps({
    nInputsLegacy,
    nInputsSegWit,
    nOutputsP2PKH: _nOutputsP2PKH,
    nOutputsP2WPKH: _nOutputsP2WPKH,
    nOutputsP2WSH,
}: {
    nInputsLegacy: number;
    nInputsSegWit: number;
    nOutputsP2PKH: number;
    nOutputsP2WPKH: number;
    nOutputsP2WSH: number;
}): number {
    const legacySigOps = nInputsLegacy * 1;
    const segwitSigOps = nInputsSegWit * 1;

    const p2pkhSigOps = 0;
    const p2wpkhSigOps = 0;
    const p2wshSigOps = nOutputsP2WSH * 1;

    return legacySigOps + segwitSigOps + p2pkhSigOps + p2wpkhSigOps + p2wshSigOps;
}


export function calculateAdjustedVsize({
    vSize,
    sigOps,
}: {
    vSize: number;
    sigOps: number;
}): number {
    return Math.max(vSize, 5 * sigOps);
}

export function calculateTxSize({
    nInputsLegacy,
    nInputsSegWit,
    nOutputsP2PKH,
    nOutputsP2WPKH,
    nOutputsP2WSH,
    feeRate,
    op_return_size,
}: {
    nInputsLegacy: number;
    nInputsSegWit: number;
    nOutputsP2PKH: number;
    nOutputsP2WPKH: number;
    nOutputsP2WSH: number;
    feeRate: number;
    op_return_size: number;
}) {
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

    const P2WPKH_OUTPUT_SIZE = 31; // Tamaño promedio de un output P2WPKH
    const BASE_OUTPUT_P2WPKH = nOutputsP2WPKH * P2WPKH_OUTPUT_SIZE;

    const P2WSH_OUTPUT_SIZE = 43; // Tamaño promedio de un output P2WSH
    const BASE_OUTPUT_P2WSH = nOutputsP2WSH * P2WSH_OUTPUT_SIZE;

    // Base weight (sin witness)
    const baseWeight =
        HEADER_SIZE * 4 +
        BASE_INPUT_LEGACY * 4 +
        BASE_INPUT_SEGWIT * 4 +
        BASE_OUTPUT_P2PKH * 4 +
        BASE_OUTPUT_P2WPKH * 4 +
        BASE_OUTPUT_P2WSH * 4 +
        op_return_size * 4;

    // Total weight
    const totalWeight = baseWeight + WITNESS_WEIGHT;

    // Virtual size (vBytes)
    const vSize = Math.ceil(totalWeight / 4);

    const sigOps = calculateSigOps({
        nInputsLegacy,
        nInputsSegWit,
        nOutputsP2PKH,
        nOutputsP2WPKH,
        nOutputsP2WSH,
    });

    const adjustedVsize = calculateAdjustedVsize({ vSize, sigOps });

    const expectedFee = adjustedVsize * feeRate;

    return {
        baseWeight,
        witnessWeight: WITNESS_WEIGHT,
        totalWeight,
        vSize,
        adjustedVsize,
        expectedFee,
        sigOps,
    };
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