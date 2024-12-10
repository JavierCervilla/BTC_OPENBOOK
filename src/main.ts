import { start } from "@/services/indexer/indexer.ts";
import { initDB } from "@/services/database/index.ts";


const db = await initDB();
await start(db);