import { assert, fail } from "@std/assert";
import * as bitcoin from "bitcoinjs-lib";

import * as tx from "./tx.ts";
import { CONFIG } from "@/config/index.ts";

let unsignedPsbt: bitcoin.Psbt;
let signedPsbt: bitcoin.Psbt;
const seller = "bc1q57y36a30vee07g8p3ra56svcrhean5rc0qr3vh";
const utxo = "d7830e5b603f2b1b2a39c43d31c5d6155e5821cb2549b6ddb05aaf8be483be82:0";
const price = 100000;
const invalid_utxo = "d7830e5b603f2b1b2a39c43d31c5d6155e5821cb2549b6ddb05aaf8be483be83:0";

async function setupTestingTX() {
    if (unsignedPsbt && signedPsbt) return;
    unsignedPsbt = await tx.createSellPSBT({
        seller,
        utxo,
        price,
    });

    const inputsToSign = [
        {
            index: 0,
            sighashType: [
                bitcoin.Transaction.SIGHASH_ANYONECANPAY |
                bitcoin.Transaction.SIGHASH_SINGLE
            ]
        }
    ];

    const auxPsbt = unsignedPsbt.clone();
    signedPsbt = tx.signPsbt({
        psbt: auxPsbt,
        inputsToSign,
        wif: CONFIG.TESTING.WIF
    });
}

Deno.test("createSellTx should create a valid psbt", async () => {
    await setupTestingTX();
    assert(unsignedPsbt.toHex(), "Psbt hex should be greater than 0");
});

Deno.test("createSellTx should throw if utxo does not exist", async () => {
    try {
        await tx.createSellPSBT({
            seller,
            utxo: invalid_utxo,
            price,
        });
        fail("Expected error was not thrown");
    } catch (error) {
        assert(error instanceof Error, "Error should be an instance of Error");
        assert(error.message.includes("UTXO doesnt exist"), "Error message should contain 'UTXO doesnt exist'");
    }
});

Deno.test("createSellTx should create a valid psbt for the testing address", async () => {
    await setupTestingTX();
    assert(unsignedPsbt.toHex(), "Psbt hex should be greater than 0");
});

Deno.test("signPsbt should sign a valid psbt with the testing wif", async () => {
    await setupTestingTX();
    assert(signedPsbt.data.inputs[0].partialSig, "Signed PSBT should have a partial signature");
});

Deno.test("extractPartialSigs should extract partial sigs from a signed psbt", async () => {
    await setupTestingTX();
    const partialSigs = tx.extractPartialSignatures(signedPsbt);
    assert(partialSigs[0].partialSig[0].signature.length >= 64 && partialSigs[0].partialSig[0].signature.length <= 72, "Partial signature should be between 64 and 72 bytes");
    console.log('Signature size: ', partialSigs[0].partialSig[0].signature.length);
});

Deno.test("reconstructTxFromPartialSigs should reconstruct a tx from partial sigs", async () => {
    await setupTestingTX();
    const partialSigs = tx.extractPartialSignatures(signedPsbt);
    const reconstructedTx = tx.reconstructTxFromPartialSigs({
        partialSigs,
        psbt: unsignedPsbt
    });
    assert(reconstructedTx.toHex() === signedPsbt.toHex(), "Reconstructed tx should be valid");
});

Deno.test("createListingTX should create a listing PSBT from a valid signed sell PSBT and valid utxo and price", async () => {
    await setupTestingTX();
    const partialSigs = tx.extractPartialSignatures(signedPsbt);
    assert(partialSigs[0].partialSig[0].signature.length >= 64 && partialSigs[0].partialSig[0].signature.length <= 72, "Partial signature should be between 64 and 72 bytes");
    const { psbt } = await tx.createListingTX({
        partialSigs,
        seller,
        utxo,
        price,
        feeRate: 10
    });
    assert(psbt.length > 0, "PSBT should be greater than 0");
    assert(psbt.includes("02000000000101"), "PSBT should contain the correct version");
});

Deno.test("decodeListingTx should decode a listing tx and reconstruct the original signed tx", async () => {
    await setupTestingTX();
    const partialSigs = tx.extractPartialSignatures(signedPsbt);
    assert(partialSigs[0].partialSig[0].signature.length >= 64 && partialSigs[0].partialSig[0].signature.length <= 72, "Partial signature should be between 64 and 72 bytes");
    const { psbt: listingPsbt } = await tx.createListingTX({
        partialSigs,
        seller,
        utxo,
        price,
        feeRate: 10
    });
    const signedListingPsbt = await tx.signPsbt({
        psbt: bitcoin.Psbt.fromHex(listingPsbt),
        inputsToSign: [
            { index: 0, sighashType: [bitcoin.Transaction.SIGHASH_ALL] }
        ],
        wif: CONFIG.TESTING.WIF
    });
    signedListingPsbt.finalizeAllInputs();
    const txhex = signedListingPsbt.extractTransaction().toHex();
    const { psbt: result_psbt, utxo: result_utxo, seller: result_seller, price: result_price } = await tx.decodeListingTx(txhex);
    assert(result_psbt === signedPsbt.toHex(), "Resultant PSBT should be the same as signed PSBT");
    assert(result_utxo === utxo, "Resultant utxo should be the same as the original utxo");
    assert(result_seller === seller, "Resultant seller should be the same as the original seller");
    assert(result_price === BigInt(price), "Resultant price should be the same as the original price");
});
