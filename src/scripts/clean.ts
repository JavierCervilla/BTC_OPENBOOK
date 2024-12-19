import { CONFIG } from "@/config/index.ts";
import { Database } from "@db/sqlite";


const db = new Database(CONFIG.DATABASE.DB_NAME);

console.log('Database opened', db);

const block_index = 875330;


console.log('Deleting blocks and atomic swaps');
db.exec('DELETE FROM blocks WHERE block_index > ?', [block_index]);
db.exec('DELETE FROM atomic_swaps WHERE block_index > ?', [block_index]);

db.close();

console.log('Database cleaned');