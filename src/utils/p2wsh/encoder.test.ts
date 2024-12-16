import { assert } from "@std/assert"

import { P2WSHEncoder } from "./encoder.ts";
import { ascii2hex } from "@/utils/hex.ts";

import * as bitcoin from "bitcoinjs-lib";

Deno.test("Should encode/decode hex to p2wsh addresses", () => {
    const text = "Hello, world! im JA!";
    const hex = ascii2hex(text)
    const addresses = P2WSHEncoder.p2wsh_encode_hex(hex);
    assert(addresses.length >= 1, "Should have at least one address");
    const decoded_hex = P2WSHEncoder.p2wsh_decode_hex(addresses as string[]);
    assert(decoded_hex, "Should have decoded hex");
    assert(decoded_hex === hex, "Decoded hex should match original hex");
});

Deno.test("Should decode psbt from p2wsh addresses", () => {
    const p2wsh_addresses = [
        "bc1qqx08qumzwnlszqzjqgqqqqqpfw0l2m5kwayazk8rkdge9dl30yuqdnc4vr",
        "bc1qq7h9ef2cklly8x6h47wnxz6nqqqqqqqqllllllcp5zrqzqqqqqqqafm8ng",
        "bc1qqqtqq9rjw6mk0unmc29e46ruu8ruspn60kndy7cqqqqqqqqpqr7spfk0zr",
        "bc1qx5qsyqqqqqqqzqtnh2ussjav7wf4n7ld8p298jzf4gvkewz5wrvs7f560a",
        "bc1qslax687py3uwrgszqqqqqq8allll7qezqgqqqqqqqqqpvqq5wfmqf8v2w0",
        "bc1qkanly77z3wdwsl8pclyqv7na5mf8kqqqqqqqqqqqqpxk5jclqmhq57qayy",
        "bc1qgc65s8v5y6qy5l4uknv99m7502xkxkwfdwsdpgwn88u8prg9clrqns2ar9",
        "bc1q8xhlf2nltzzprlccshqgjpzvpv29dykw2l2umw7s64zqde2pa9mqszwx3k",
        "bc1qxxsjuet20vkd9mteqqqqqqqqqqtqq9rjw6mk0unmc29e46ruu8rsuxa9c3",
        "bc1qeqr85ldx6fasyjpsg5pzzq9w0rzx9wkevucu694rva77t5wc33lsqdkrdw",
        "bc1q7qrqd8rlu2ss54caal5nj2szyq7dr7x0wdmk5pe0wxxp9pg4xhxs7rftmk",
        "bc1qq7wald7l06e80xt6m0ut0jl2w5qjzqcjp6ewasjs8n83jeyuunvq0c7vv8",
        "bc1qvarpkrunlm8lgetreh3h68zalavvfpcqqqqqqqgrqjpsqqqqqqqqp7l8v5"
      ];
    const decoded_hex = P2WSHEncoder.p2wsh_decode_hex(p2wsh_addresses);

    const psbt = bitcoin.Psbt.fromHex(decoded_hex);

    console.log(psbt.txInputs);
    console.log(psbt.txOutputs);
    assert(decoded_hex, "Should have decoded hex");
})
