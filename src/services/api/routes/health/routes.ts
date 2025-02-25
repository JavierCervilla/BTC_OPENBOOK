import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";
import * as xcp from "@/utils/xcp/rpc.ts";

import { CONFIG } from "@/config/index.ts";
import { Database } from "@db/sqlite";


export const controller = {
    checkHealth: async (_req: Request, res: Response) => {
        const db = new Database(
            CONFIG.DATABASE.DB_NAME,
            { readonly: true }
        );
        try {
            const indexer_version = CONFIG.VERSION.STRING;
            const openbook_version = CONFIG.OPENBOOK.VERSION.STRING;
            const xcp_health = await xcp.checkCounterpartyVersion();
            const electrum_health = await fetch(`${CONFIG.ELECTRUM.RPC_URL}/health`);
            const electrum_health_json = await electrum_health.json();
            const last_openbook_query = await db.prepare("SELECT MAX(block_index) AS last_block FROM blocks");
            const { last_block: last_openbook_block } = await last_openbook_query.get() as { last_block: number };
            const last_bitcoin_block = xcp_health.backend_height
            const last_counterparty_block = xcp_health.counterparty_height;
            const last_electrum_block = electrum_health_json.latestBlock.height;
            const openbook_ready = last_openbook_block === last_bitcoin_block && last_openbook_block === last_counterparty_block;

            const network_info = {
                counterparty_version: xcp_health.version,
                counterparty_ready: xcp_health.server_ready,
                electrum_ready: electrum_health_json.status === "healthy",
                openbook_ready,
                last_bitcoin_block,
                last_counterparty_block,
                last_electrum_block,
                last_openbook_block,
            };
            const result = {
                indexer_version,
                openbook_version,
                ...network_info,
            };
            return handleSuccess(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        } finally {
            await db.close();
        }
    },
}

export function configureHealthRoutes(router: Router) {
    router.get("/", controller.checkHealth);
    return router;
}