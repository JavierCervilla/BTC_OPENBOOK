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
    },
});

export default log.getLogger("indexerLogger");