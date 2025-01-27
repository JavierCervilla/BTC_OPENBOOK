import type { Tspec } from 'tspec';

import type { controller } from "./routes.ts";

export type BlocksApiSpec = Tspec.DefineApiSpec<{
    tags: ["Health"];
    paths: {
        "/api/v1/health": {
            get: {
                summary: "Performs a health check",
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.checkHealth,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                indexer_version: { type: 'string' },
                                openbook_version: { type: 'string' },
                                counterparty_version: { type: 'string' },
                                counterparty_ready: { type: 'boolean' },
                                last_counterparty_block: { type: 'number' },
                                last_bitcoin_block: { type: 'number' },
                                last_openbook_block: { type: 'number' },
                            },
                        },
                    }
                }
            }
        },
    }
}>;


