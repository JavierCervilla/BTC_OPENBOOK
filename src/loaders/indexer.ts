import { start } from "@/services/indexer/indexer.ts";
import { initDB } from "@/services/database/index.ts";

export async function indexerLoader() {
    const db = await initDB();
    await start(db);
}

export default indexerLoader;