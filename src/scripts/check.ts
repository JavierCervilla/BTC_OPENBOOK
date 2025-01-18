import { Database } from "@db/sqlite";
import { EVENT_NAMES } from "@/utils/xcp/rpc.ts";

const CONFIG = {
    DATABASE: {
        DB_NAME: "openbook.db",
    }
};

const db = new Database(CONFIG.DATABASE.DB_NAME);

try {
    const blocks = await db.prepare("SELECT * FROM blocks").all();

    const missingFields = blocks.filter(block => {
        const events = JSON.parse(block.events);
        return EVENT_NAMES.some(e_name => !(e_name in events));
    });

    if (missingFields.length > 0) {
        console.warn("Algunos bloques no tienen todos los campos de eventos necesarios:", missingFields.map(block => block.block_index));
    } else {
        console.log("Todos los bloques tienen todos los campos de eventos necesarios.");
        Deno.exit(0);
    }

    await db.exec("BEGIN TRANSACTION");
    const updatePromises = blocks.map((block) => {
        const events = JSON.parse(block.events);
        for (const e_name of EVENT_NAMES) {
            if (!events[e_name]) {
                events[e_name] = 0;
            }
        }
        return db.prepare("UPDATE blocks SET events = :events WHERE block_index = :block_index").run({
            events: JSON.stringify(events),
            block_index: block.block_index
        });
    });
    await Promise.all(updatePromises);
    await db.exec("COMMIT");
} catch (error) {
    console.error("Error executing query:", error);
    await db.exec("ROLLBACK");
}
