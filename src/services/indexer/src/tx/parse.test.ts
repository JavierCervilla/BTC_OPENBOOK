import { assert } from "@std/assert";
import { Database } from "@db/sqlite";

import * as rpc from "@/utils/btc/rpc.ts";
import * as parser from "@/services/indexer/src/tx/parse.ts";

Deno.test("parseTransaction: should parse a transaction with an OP_RETURN output", async () => {
    const txid = "73d183383af7e4699139be084cea862cfd22478a40db0c1d6f4339f95ba8ed3b";
    const parsed = await parser.parseTxForAtomicSwap(txid);
    assert(parsed);
    assert(parsed.txid === txid, "txid mismatch");
    assert(parsed.protocol === 0, "protocol mismatch");
    assert(parsed.block_index === 870466, "block index mismatch");
    assert(parsed.assetId === "MINTS", "assetId mismatch");
    assert(parsed.qty === 42000n, "qty mismatch");
    assert(parsed.total_price === 84000n, "total_price mismatch");
    assert(parsed.unit_price === 2n, "unit_price mismatch");
    assert(parsed.seller === "bc1qqvh9ea62nxvjsk24h3d6upt2fy4upyuglsdm57", "seller mismatch");
    assert(parsed.buyer === "bc1qr9nkqgzc6vzxjslqgxck3z480yq85aa98wu3fa", "buyer mismatch");
});

Deno.test("parseTransaction: should parse a transaction with an OP_RETURN output and decimal unit_price", async () => {
    const txid = "2494217e8e2290b78238441efe0d354747911a543cc5c451289d303c37e1dbfc";
    const parsed = await parser.parseTxForAtomicSwap(txid);
    assert(parsed);
    assert(parsed.txid === txid, "txid mismatch");
    assert(parsed.protocol === 0, "protocol mismatch");
    assert(parsed.block_index === 867580, "block index mismatch");
    assert(parsed.assetId === "PEPEFAIR", "assetId mismatch");
    assert(parsed.qty === 1000n, "qty mismatch");
    assert(parsed.total_price === 30000n, "total_price mismatch");
    assert(parsed.unit_price === 30n, "unit_price mismatch");
    assert(parsed.seller === "bc1qwxzxm83nnqlr86vusgswvu3wd6hnq9u8d03zd9", "seller mismatch");
    assert(parsed.buyer === "bc1qgz3k29sj7u8g0eqy2wm07chfnpyjz8g45r0xgw", "buyer mismatch");
});

Deno.test("parseTransaction: should return undefined if transaction has OP_RETURN output but no openbook data", async () => {
    const txid = "0e1def43ffd87089f87b888e57dbbc489ee4713b86525f913140070883085893";
    const parsed = await parser.parseTxForAtomicSwap(txid);
    assert(parsed === undefined, "parsed should be undefined");
});

Deno.test("parseTransaction: should return undefined if transaction has no OP_RETURN output", async () => {
    const txid = "4cb1cb00666829cfa833d8e8278113484bc6233517861bb41c12f7c8a0f808ac";
    const parsed = await parser.parseTxForAtomicSwap(txid);
    assert(parsed === undefined, "parsed should be undefined");
});