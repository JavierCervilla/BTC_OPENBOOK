import { CONFIG } from "@/config/index.ts";
import * as log from '@std/log';

log.setup({
    handlers: {
        console_indexer: new log.ConsoleHandler("DEBUG", {
            formatter: (record: log.LogRecord) => `[INDEXER][${record.levelName}] ${record.msg}`,
        }),
        console_api: new log.ConsoleHandler("DEBUG", {
            formatter: (record: log.LogRecord) => `[API][${record.levelName}] ${record.msg}`,
        }),
        console_testing: new log.ConsoleHandler("DEBUG", {
            formatter: (record: log.LogRecord) => `[TEST][${record.levelName}] ${record.msg}`,
        }),
        file: new log.FileHandler("WARN", {
            filename: CONFIG.INDEXER.LOGS_FILE,
            formatter: (record: log.LogRecord) => `[INDEXER][${record.levelName}] [${record.datetime}] ${record.msg}`,
        }),
        api: new log.FileHandler("DEBUG", {
            filename: CONFIG.API.LOGS_FILE,
            formatter: (record: log.LogRecord) => `[API][${record.levelName}] [${record.datetime}] ${record.msg}`,
        })
    },

    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console_indexer", "file"],
        },
        indexerLogger: {
            level: "DEBUG",
            handlers: ["console_indexer", "file"],
        },
        apiLogger: {
            level: "DEBUG",
            handlers: ["console_api", "api"],
        },
        testingLogger: {
            level: "DEBUG",
            handlers: ["console_testing"],
        }
    },
});

const logger = Deno.env.get("NODE_ENV") === "test" ? log.getLogger("testingLogger") : log.getLogger("indexerLogger");
const apiLogger = Deno.env.get("NODE_ENV") === "test"? log.getLogger("testingLogger") : log.getLogger("apiLogger");
const testingLogger = log.getLogger("testingLogger");

export const InitialPrompt = () => {
    logger.info(`Openbook Indexer v${CONFIG.VERSION.MAJOR}.${CONFIG.VERSION.MINOR}.${CONFIG.VERSION.PATCH}`)
    logger.info(`Indexer started on ${CONFIG.NETWORK}`)
    logger.info(`Database: ${CONFIG.DATABASE.DB_NAME}`)
    logger.info(`Indexer logs file: ${CONFIG.INDEXER.LOGS_FILE}`)
    logger.info(`API logs file: ${CONFIG.API.LOGS_FILE}`)
}

export { logger, apiLogger, testingLogger };
export default log.getLogger("indexerLogger");