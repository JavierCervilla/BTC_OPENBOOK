import { assert } from "@std/assert";

import * as rpc from "./rpc.ts";

Deno.test("getEventsCountByBlock", async () => {
    const events = await rpc.getEventsCountByBlock(280330);
    for (const event of rpc.EVENT_NAMES) {
        assert(events[event] !== undefined, `Event ${event} is missing`);
    }
    assert(events.NEW_BLOCK === 1);
    assert(events.BLOCK_PARSED === 1);
});
