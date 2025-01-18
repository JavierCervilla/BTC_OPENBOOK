import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";

import * as blocks from "@/services/database/blocks.ts";
import type { Block, BlockSummary } from "@/services/database/blocks.d.ts";
import { DEFAULT_PAGINATION_LIMIT } from "@/services/database/utils/pagination.ts";


export const controller = {
    getBlocks: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : DEFAULT_PAGINATION_LIMIT;
            const result = await blocks.getBlocks({ page, limit });
            return handleSuccess<{
                result: Block[],
                total: number,
                page: number,
                limit: number,
                totalPages: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getBlocksGroupedByDayWithEventSums: async (_req: Request, res: Response) => {
        try {
            const result = await blocks.getBlocksGroupedByDayWithEventSums();
            return handleSuccess<{
                result: BlockSummary[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
}

export function configureBlocksRoutes(router: Router) {
    router.get("/", controller.getBlocks);
    router.get("/summary", controller.getBlocksGroupedByDayWithEventSums);
    return router;
}
