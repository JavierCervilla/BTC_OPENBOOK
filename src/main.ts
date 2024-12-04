import { start } from "@/services/indexer/indexer.ts";
import { initDB } from "@/services/database/index.ts";


const db = initDB();
await start(db);