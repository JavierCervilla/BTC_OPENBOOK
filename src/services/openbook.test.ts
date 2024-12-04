import { assertEquals, assert } from "jsr:@std/assert";
import { OpenBook } from "./openbook.ts";
import { bin2hex } from "@/utils/index.ts";

Deno.test("OpenBook: should generate a valid OP_RETURN message", () => {
    const message = OpenBook.encode_OP_RETURN({
        protocol: 0,
        asset_id: "A6524912715479370914",
        qty: 1n,
    });
    const hexMessage = bin2hex(message);
    assert(hexMessage);
    assert(hexMessage.length > 0);
    assert(hexMessage, "4f4200413635323439313237313534373933373039313401")
});

Deno.test("OpenBook: should decode a valid OP_RETURN message", () => {
    const message = OpenBook.encode_OP_RETURN({
        protocol: 0,
        asset_id: "A6524912715479370914",
        qty: 1n,
    });
    const hexMessage = bin2hex(message);
    const decoded = OpenBook.decode_OP_RETURN({
        protocol: 0,
        message: hexMessage,
    });
    assertEquals(decoded.assetId, "A6524912715479370914");
    assertEquals(decoded.qty, 1n);
});