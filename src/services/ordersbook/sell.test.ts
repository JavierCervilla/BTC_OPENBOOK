import { assert, fail } from "@std/assert";

import * as tx from "./sell.ts";

Deno.test("createSellOrderPsbt should create a valid psbt", async () => {
    const result = await tx.createSellOrderPsbt({
        seller: "bc1q57y36a30vee07g8p3ra56svcrhean5rc0qr3vh",
        utxo: "d7830e5b603f2b1b2a39c43d31c5d6155e5821cb2549b6ddb05aaf8be483be82:0",
        price: 100000
    });
    assert(result.psbt.length > 0, "Psbt hex should be greater than 0");
});

Deno.test("createSellOrderPsbt should throw if utxo does not exist", async () => {
    try {
        await tx.createSellOrderPsbt({
            seller: "bc1q57y36a30vee07g8p3ra56svcrhean5rc0qr3vh",
        utxo: "d7830e5b603f2b1b2a39c43d31c5d6155e5821cb2549b6ddb05aaf8be483be83:0",
        price: 100000
        });
        fail("Expected error was not thrown");
    } catch (error) {
        assert(error instanceof Error, "Error should be an instance of Error");
        assert(error.message.includes("UTXO doesnt contain any balance"), "Error message should contain 'UTXO doesnt contain any balance'");
    }
});
