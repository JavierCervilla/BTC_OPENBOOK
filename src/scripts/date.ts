import { Database } from "@db/sqlite";

const CONFIG = {
    DATABASE: {
        DB_NAME: "openbook.db",
    }
};

const db = new Database(CONFIG.DATABASE.DB_NAME);

try {
    const blocks = await db.prepare("SELECT * FROM blocks").all();

    await db.exec("BEGIN TRANSACTION");
    const updatePromises = blocks.map((block) => {
        const date = Number.isInteger(block.block_time) ? new Date(block.block_time * 1000).toISOString() : new Date(block.block_time).toISOString();
        return db.prepare("UPDATE blocks SET block_time = :date WHERE block_index = :block_index").run({
            date: date,
            block_index: block.block_index
        });
    });
    await Promise.all(updatePromises)
    const transactions = await db.prepare("SELECT * FROM atomic_swaps").all();
    console.log(transactions.length);
    const updatePromisesTXs = transactions.map((transaction) => {
        const date = new Date(transaction.timestamp * 1000).toISOString();
        return db.prepare("UPDATE atomic_swaps SET timestamp = :date WHERE txid = :txid").run({
            date: date,
            txid: transaction.txid
        });
    });
    await Promise.all(updatePromisesTXs);
    await db.exec("COMMIT");
} catch (error) {
    console.error("Error executing query:", error);
    await db.exec("ROLLBACK");
}
