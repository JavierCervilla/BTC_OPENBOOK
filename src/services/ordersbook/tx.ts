import * as bitcoin from "bitcoinjs-lib";
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

import type { SellOrderParams } from "./sell.d.ts";
import type { inputToSign, partialSignature } from "@/services/ordersbook/tx.d.ts";

import { CONFIG } from "@/config/index.ts";
import { apiLogger } from "@/utils/logger.ts";
import { bin2hex, hex2bin } from "@/utils/index.ts";
import * as btc from "@/utils/btc/rpc.ts";
import { OpenBook } from "@/services/openbook/openbook.ts";
import p2wsh from "@/utils/p2wsh/encoder.ts";
import { calculateTxSize, selectUtxos } from "@/utils/btc/tx.ts";

const ECPair = ECPairFactory(ecc);

export async function createSellPSBT(sellOrderParams: SellOrderParams) {
    try {
        const { utxo, seller, price } = sellOrderParams;
        const [utxoTxId, utxoVout] = utxo.split(":");
        const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

        const inputsToSign = [{ index: 0, sighashTypes: [bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY], address: seller }];
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
        return {
            psbt,
            inputsToSign,
        };
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
            psbt.signInput(input.index, keyPair, input.sighashTypes);
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

async function fetchUTXOs(seller: string): Promise<UTXO[]> {
    const utxos = await btc.getUTXO(seller);
    if (!utxos.length) {
        throw new Error("Insufficient funds to create listing tx");
    }
    return utxos;
}

function initializePSBT(): bitcoin.Psbt {
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    psbt.setLocktime(CONFIG.OPENBOOK.TIMELOCK);
    return psbt;
}

async function fetchUTXORawTransaction(utxo: string): Promise<string> {
    const [utxoTxId] = utxo.split(":");
    const utxoRawTx = await btc.getTransaction(utxoTxId, false);
    if (!utxoRawTx) {
        throw new Error("UTXO doesn't exist");
    }
    return utxoRawTx;
}

function addListingOutputs(
    psbt: bitcoin.Psbt,
    {
        utxo,
        price,
        partialSigs,
    }: { utxo: string; price: number; partialSigs: partialSignature[] }
): { p2wsh_signature: string[], op_return: Uint8Array } {
    const ob_message = OpenBook.encode_Listing_OP_RETURN({ utxo, price, protocol: 0 });
    const op_return = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, ob_message]);
    psbt.addOutput({ script: op_return, value: 0n });

    const signature = bin2hex(partialSigs[0].partialSig[0].signature);
    const p2wsh_signature = p2wsh.p2wsh_encode_hex(signature, "bitcoin");
    for (const p2wsh_address of p2wsh_signature) {
        psbt.addOutput({ address: p2wsh_address, value: 330n });
    }
    return { p2wsh_signature, op_return }
}

export function calculateTransactionSize(
    { seller, p2wshCount, feeRate, op_return, buyer }: { seller: string; p2wshCount: number; feeRate: number, op_return: Uint8Array, buyer?: string }
): { baseSize: number; vSize: number; expectedFee: number } {
    const nInputsLegacy = (seller.startsWith("1") ? 1 : 0) + (buyer?.startsWith("1") ? 1 : 0);
    const nInputsSegWit = (seller.startsWith("bc1q") ? 1 : 0) + (buyer?.startsWith("bc1q") ? 1 : 0);
    const nOutputsP2PKH = nInputsLegacy > 0 ? nInputsLegacy : 0;
    const nOutputsP2WPKH = nInputsSegWit > 0 ? nInputsSegWit : 0;
    const nOutputsP2WSH = p2wshCount;

    const {
        baseWeight: baseSize,
        vSize,
        expectedFee,
    } = calculateTxSize({
        op_return_size: op_return.length,
        nInputsLegacy,
        nInputsSegWit,
        nOutputsP2PKH,
        nOutputsP2WPKH,
        nOutputsP2WSH,
        feeRate,
    });
    return { baseSize, vSize, expectedFee };
}

async function addInputsToPSBT(psbt: bitcoin.Psbt, selectedUtxos: UTXO[]): Promise<void> {
    for (const utxo of selectedUtxos) {
        const txid = utxo.txid;
        const rawTX = await btc.getTransaction(txid, false);
        psbt.addInput({
            hash: hex2bin(txid).reverse(),
            index: utxo.vout,
            nonWitnessUtxo: hex2bin(rawTX),
        });
    }
}

function calculateTotalInputValue(utxos: UTXO[]): bigint {
    return utxos.reduce((acc, utxo) => acc + BigInt(utxo.value), 0n);
}

function calculateTotalOutputValue(outputs: { value: bigint }[]): bigint {
    return outputs.reduce((acc, output) => acc + BigInt(output.value), 0n);
}

export async function createListingTX({
    partialSigs,
    seller,
    utxo,
    price,
    feeRate = 10,
}: {
    partialSigs: partialSignature[];
    seller: string;
    utxo: string;
    price: number;
    feeRate: number;
}): Promise<{
    psbt: string;
    btcIn: bigint;
    btcOut: bigint;
    change: bigint;
    vSize: number;
    fee: number;
}> {
    try {
        const utxos = await fetchUTXOs(seller);
        const psbt = initializePSBT();
        await fetchUTXORawTransaction(utxo);
        const { p2wsh_signature, op_return } = addListingOutputs(psbt, { utxo, price, partialSigs });

        const { expectedFee, vSize } = calculateTransactionSize({
            seller,
            p2wshCount: p2wsh_signature.length,
            op_return,
            feeRate,
        });

        const selectedUtxos = selectUtxos(utxos, BigInt(expectedFee));
        await addInputsToPSBT(psbt, selectedUtxos);

        const btcIn = calculateTotalInputValue(selectedUtxos);
        const btcOut = calculateTotalOutputValue(psbt.txOutputs);
        const change = btcIn - btcOut - BigInt(expectedFee);
        psbt.addOutput({ address: seller, value: change });

        return {
            psbt: psbt.toHex(),
            btcIn,
            btcOut,
            change,
            vSize,
            fee: expectedFee,
        };
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}

function isOpReturnOutput(output: bitcoin.TxOutput) {
    return output.script[0] === bitcoin.opcodes.OP_RETURN;
}

function isP2WSHOutput(output: bitcoin.TxOutput): boolean {
    const script = output.script;
    return script.length === 34 && script[0] === bitcoin.opcodes.OP_0;
}

function scriptToAddress(script: Uint8Array, network: bitcoin.Network = bitcoin.networks.bitcoin): string | null {
    try {
        // P2PKH: OP_DUP OP_HASH160 <PubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
        if (script.length === 25 && script[0] === bitcoin.opcodes.OP_DUP && script[1] === bitcoin.opcodes.OP_HASH160) {
            const pubKeyHash = script.slice(3, 23);
            return bitcoin.address.toBase58Check(pubKeyHash, network.pubKeyHash);
        }

        // P2SH: OP_HASH160 <ScriptHash> OP_EQUAL
        if (script.length === 23 && script[0] === bitcoin.opcodes.OP_HASH160) {
            const scriptHash = script.slice(2, 22);
            return bitcoin.address.toBase58Check(scriptHash, network.scriptHash);
        }

        // P2WPKH: OP_0 <PubKeyHash>
        if (script.length === 22 && script[0] === bitcoin.opcodes.OP_0) {
            const pubKeyHash = script.slice(2);
            return bitcoin.address.toBech32(pubKeyHash, 0, network.bech32);
        }

        // P2WSH: OP_0 <ScriptHash>
        if (script.length === 34 && script[0] === bitcoin.opcodes.OP_0) {
            const scriptHash = script.slice(2);
            return bitcoin.address.toBech32(scriptHash, 0, network.bech32);
        }

        return null; // Unknown script type
    } catch (error) {
        console.error("Error converting script to address:", error);
        return null;
    }
}

function extractPubKeyAndAddressFromInput(input: { witness: Uint8Array[], script: Uint8Array }, network: bitcoin.Network = bitcoin.networks.bitcoin): { pubkey: string | null, address: string | null } {
    try {
        let pubkey: Uint8Array | null = null;
        let address: string | null = null;

        //segwit
        if (input.witness.length === 2) {
            pubkey = input.witness[1]; // The public key is in the second element of the witness
            const pubkeyHash = bitcoin.crypto.hash160(pubkey);
            address = bitcoin.address.toBech32(pubkeyHash, 0, network.bech32);
        }

        //legacy
        else if (input.script.length > 0) {
            const script = input.script;
            if (script.length === 25 && script[0] === bitcoin.opcodes.OP_DUP && script[1] === bitcoin.opcodes.OP_HASH160) {
                const pubKeyHash = script.slice(3, 23);
                address = bitcoin.address.toBase58Check(pubKeyHash, network.pubKeyHash);
            }
        }

        return {
            pubkey: pubkey ? Array.from(pubkey).map(byte => byte.toString(16).padStart(2, '0')).join('') : null,
            address
        };
    } catch (error) {
        console.error("Error extracting public key and address from input:", error);
        return { pubkey: null, address: null };
    }
}

export async function decodeListingTx(txhex: string): Promise<{
    utxo: string;
    price: bigint;
    seller: string;
    psbt: string;
}> {
    try {
        const tx = bitcoin.Transaction.fromHex(txhex);

        // Extract utxo and price from OP_RETURN
        const opReturnScript = tx.outs.find(isOpReturnOutput)?.script;
        if (!opReturnScript) throw new Error("No OP_RETURN output found");

        const message = bin2hex(opReturnScript).slice(4);
        const { utxo, price } = OpenBook.decode_Listing_OP_RETURN({ message, protocol: 0 });
        if (!utxo || !price) throw new Error("Invalid OP_RETURN data");

        // Extract partial signatures from P2WSH outputs
        const p2wshOutputs = tx.outs
            .filter(isP2WSHOutput)
            .map(output => scriptToAddress(output.script));
        if (!p2wshOutputs.length || p2wshOutputs.includes(null)) throw new Error("No P2WSH outputs found");

        const partialSigHex = p2wsh.p2wsh_decode_hex(p2wshOutputs as string[]);
        const partialSigBytes = hex2bin(partialSigHex);

        // Extract seller and pubkey from the first input
        const input0 = tx.ins[0];
        const { address: seller, pubkey } = extractPubKeyAndAddressFromInput(input0);
        if (!seller || !pubkey) throw new Error("Invalid seller address or public key");

        // Reconstruct the partial signatures
        const pubkeyBytes = input0.witness[1];
        const partialSignatures = [{
            index: 0,
            partialSig: [{ pubkey: pubkeyBytes, signature: partialSigBytes }]
        }];

        // Create the unsigned sell psbt
        const { psbt: unsignedSellPsbt } = await createSellPSBT({ utxo, seller, price: Number(price) });

        // Add the signatures to the sell psbt
        const signedPsbt = reconstructTxFromPartialSigs({
            partialSigs: partialSignatures,
            psbt: unsignedSellPsbt,
        });

        return { utxo, price, seller, psbt: signedPsbt.toHex() };
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}

export function checkPSBTForSignatures(psbt: bitcoin.Psbt) {
    try {
        return psbt.data.inputs.every(input => {
            return input.finalScriptWitness !== undefined || input.finalScriptSig !== undefined;
        });
    } catch (error) {
        apiLogger.error(error);
        return false;
    }
}