import { CONFIG } from "@/config/index.ts";
import * as log from '@std/log';

log.setup({
    handlers: {
        console: new log.ConsoleHandler("DEBUG", {
            formatter: (record: log.LogRecord) => `[${record.levelName}] ${record.msg}`,
        }),
        file: new log.FileHandler("WARN", {
            filename: CONFIG.INDEXER.LOGS_FILE,
            formatter: (record: log.LogRecord) => `[${record.levelName}] [${record.datetime}] ${record.msg}`,
        }),
        api: new log.FileHandler("DEBUG", {
            filename: CONFIG.API.LOGS_FILE,
            formatter: (record: log.LogRecord) => `[${record.levelName}] [${record.datetime}] ${record.msg}`,
        }),
    },

    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console", "file"],
        },
        indexerLogger: {
            level: "DEBUG",
            handlers: ["console", "file"],
        },
        apiLogger: {
            level: "DEBUG",
            handlers: ["console", "file"],
        },
    },
});

const logger = log.getLogger("indexerLogger");
const apiLogger = log.getLogger("apiLogger");

export const InitialPrompt = () => {
    logger.info(`Openbook Indexer v${CONFIG.VERSION.MAJOR}.${CONFIG.VERSION.MINOR}.${CONFIG.VERSION.PATCH}`)
    logger.info(`Indexer started on ${CONFIG.NETWORK}`)
    logger.info(`Database: ${CONFIG.DATABASE.DB_NAME}`)
    logger.info(`Indexer logs file: ${CONFIG.INDEXER.LOGS_FILE}`)
    logger.info(`API logs file: ${CONFIG.API.LOGS_FILE}`)
}

export { logger, apiLogger };
export default log.getLogger("indexerLogger");