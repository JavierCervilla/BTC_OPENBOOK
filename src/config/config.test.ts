import { assert } from "@std/assert";

import { CONFIG } from "@/config/index.ts";


Deno.test("Should have a version", () => {
    assert(CONFIG.VERSION.STRING, "Version should be a string");
});

Deno.test("Should have a network", () => {
    assert(CONFIG.NETWORK, "Network should be a string");
});

Deno.test("Should have a testing wif", () => {
    assert(CONFIG.TESTING.WIF, "Testing wif should be a string");
});

Deno.test("should have a bitcoin config", () => {
    assert(CONFIG.BITCOIN, "Bitcoin config should be an object");

    assert(CONFIG.BITCOIN.RPC_URL, "Bitcoin rpc url should be a string");
    assert(CONFIG.BITCOIN.RPC_USER, "Bitcoin rpc user should be a string");
    assert(CONFIG.BITCOIN.RPC_PASSWORD, "Bitcoin rpc password should be a string");
});

Deno.test("should have a xcp config", () => {
    assert(CONFIG.XCP, "XCP config should be an object");

    assert(CONFIG.XCP.RPC_URL, "XCP rpc url should be a string");
    assert(CONFIG.XCP.RPC_USER, "XCP rpc user should be a string");
    assert(CONFIG.XCP.RPC_PASSWORD, "XCP rpc password should be a string");
});

Deno.test("should have a api config", () => {
    assert(CONFIG.API, "API config should be an object");

    assert(typeof(CONFIG.API.PORT) === "number", "API port should be a number");
    assert(CONFIG.API.LOGS_FILE, "API logs file should be a string");
});

Deno.test("should have a indexer config", () => {
    assert(CONFIG.INDEXER, "Indexer config should be an object");

    assert(CONFIG.INDEXER.LOGS_FILE, "logs file should be a string");
    assert(typeof(CONFIG.INDEXER.START_BLOCK) === "number", "start block should be a number");
    assert(typeof(CONFIG.INDEXER.START_OPENBOOK_LISTINGS_BLOCK) === "number", "start openbook listings block should be a number");
});

