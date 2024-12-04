import { CONFIG } from "@/config/index.ts";
import { Database } from "@db/sqlite";
import logger from "@/services/indexer/src/logger.ts";
import { LogRecord } from "@std/log/base-handler";

export async function start(db: Database) {
    try {
        logger.info(`Openbook Indexer v${CONFIG.VERSION.MAJOR}.${CONFIG.VERSION.MINOR}.${CONFIG.VERSION.PATCH}`)
        logger.info(`Indexer started on ${CONFIG.NETWORK}`)
        logger.info(`Database: ${CONFIG.DATABASE.DB_NAME}`)
        logger.info(`Logs file: ${CONFIG.INDEXER.LOGS_FILE}`)
    } catch (error) {
        console.error(error);
    }
}
