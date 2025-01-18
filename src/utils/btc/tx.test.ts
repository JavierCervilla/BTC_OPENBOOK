import * as tx from "./tx.ts";
import { assert } from "@std/assert";

Deno.test("calculateSigOps should calculate the number of sigops for a given tx", () => {
    const sigOps = tx.calculateSigOps({
        nInputsLegacy: 0,
        nInputsSegWit: 1,
        nOutputsP2PKH: 0,
        nOutputsP2WPKH: 1,
        nOutputsP2WSH: 3,
    });
    assert(sigOps === 4, "Sigops should be 1");
});

Deno.test("calculateAdjustedVsize should calculate the adjusted vsize for a given tx", () => {
    const adjustedVsize = tx.calculateAdjustedVsize({
        vSize: 100,
        sigOps: 2,
    });
    assert(adjustedVsize === 100, "Adjusted vsize should be 100");
});

Deno.test("calculateTxSize should calculate the size of a given tx", () => {
    const txSize = tx.calculateTxSize({
        nInputsLegacy: 0,
        nInputsSegWit: 1,
        nOutputsP2PKH: 0,
        nOutputsP2WPKH: 1,
        nOutputsP2WSH: 3,
        feeRate: 10,
        op_return_size: 56,
    });

    assert(txSize.vSize === 294, "vSize should be 294");
})
