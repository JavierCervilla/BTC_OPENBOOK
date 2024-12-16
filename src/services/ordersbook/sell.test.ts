import { assert, fail } from "@std/assert";

import { createSellOrderPsbt } from "./sell.ts";

Deno.test("createSellOrderPsbt should create a valid psbt", async () => {
    const result = await createSellOrderPsbt({
        seller: "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt",
        utxo: "4b9ff56e967749d158e3b35192b7f1793807ae5ca558b7fe439b57af9d330b53:0",
        price: 100000
    });
    assert(result.psbt.length > 0, "Psbt hex should be greater than 0");
});

Deno.test("createSellOrderPsbt should throw if utxo does not exist", async () => {
    try {
        await createSellOrderPsbt({
            seller: "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt",
            utxo: "4b9ff56e967749d158e3b35192b7f1793807ae5ca558b7fe439b57af9d330b52:0",
            price: 100000
        });
        fail("Expected error was not thrown");
    } catch (error) {
        assert(error instanceof Error, "Error should be an instance of Error");
        assert(error.message.includes("UTXO doesnt contain any balance"), "Error message should contain 'UTXO doesnt contain any balance'");
    }
});
