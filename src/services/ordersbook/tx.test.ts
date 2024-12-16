import { assert, fail } from "@std/assert";
import * as bitcoin from "bitcoinjs-lib";

import * as tx from "./tx.ts";
import { CONFIG } from "@/config/index.ts";

let testPsbt: bitcoin.Psbt;
let signedPsbt: bitcoin.Psbt;

async function setupTestingTX() {
    testPsbt = await tx.createSellTx({
        seller: "bc1q57y36a30vee07g8p3ra56svcrhean5rc0qr3vh",
        utxo: "5153764cce9d80e1fc1226288d2ac0faa3198e01c027cbf5fc0ad287438245cc:0",
        price: 100000
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

    const unsignedPsbt = testPsbt.clone();
    signedPsbt = tx.signPsbt({
        psbt: unsignedPsbt,
        inputsToSign,
        wif: CONFIG.TESTING.WIF
    });
}

Deno.test("createSellTx should create a valid psbt", async () => {
    const result = await tx.createSellTx({
        seller: "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt",
        utxo: "4b9ff56e967749d158e3b35192b7f1793807ae5ca558b7fe439b57af9d330b53:0",
        price: 100000
    });
    assert(result.toHex(), "Psbt hex should be greater than 0");
});

Deno.test("createSellTx should throw if utxo does not exist", async () => {
    try {
        await tx.createSellTx({
            seller: "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt",
            utxo: "4b9ff56e967749d158e3b35192b7f1793807ae5ca558b7fe439b57af9d330b52:0",
            price: 100000
        });
        fail("Expected error was not thrown");
    } catch (error) {
        assert(error instanceof Error, "Error should be an instance of Error");
        assert(error.message.includes("UTXO doesnt exist"), "Error message should contain 'UTXO doesnt exist'");
    }
});

Deno.test("createSellTx should create a valid psbt for the testing address", async () => {
    const result = await tx.createSellTx({
        seller: "bc1q57y36a30vee07g8p3ra56svcrhean5rc0qr3vh",
        utxo: "5153764cce9d80e1fc1226288d2ac0faa3198e01c027cbf5fc0ad287438245cc:0",
        price: 100000
    });
    assert(result.toHex(), "Psbt hex should be greater than 0");
});

Deno.test("signPsbt should sign a valid psbt with the testing wif", async () => {
    await setupTestingTX();
    assert(signedPsbt.data.inputs[0].partialSig, "Signed PSBT should have a partial signature");
});

Deno.test("extractPartialSigs should extract partial sigs from a signed psbt", async () => {
    await setupTestingTX();
    const partialSigs = tx.extractPartialSignatures(signedPsbt);
    assert(partialSigs[0].partialSig[0].signature.length === 71, "Partial signature should be 71 bytes");
});

Deno.test("reconstructTxFromPartialSigs should reconstruct a tx from partial sigs", async () => {
    await setupTestingTX();
    const partialSigs = tx.extractPartialSignatures(signedPsbt);
    const reconstructedTx = tx.reconstructTxFromPartialSigs({
        partialSigs,
        psbt: testPsbt
    });
    assert(reconstructedTx.toHex() === signedPsbt.toHex(), "Reconstructed tx should be valid");
});