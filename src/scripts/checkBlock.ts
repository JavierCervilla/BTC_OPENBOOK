import * as rpc from "@/utils/btc/rpc.ts"
import * as parser from "@/services/indexer/src/tx/parse.ts"
import { Database } from "@db/sqlite";
import { initializeDatabase } from "@/services/database/index.ts";

const block = 885139
const blockInfo = await rpc.getBlock(block);

const db = new Database(":memory:");
await initializeDatabase(db);

const { atomic_swaps, openbook_listings } = await parser.parseBlock(db, blockInfo);

console.log(atomic_swaps, openbook_listings)