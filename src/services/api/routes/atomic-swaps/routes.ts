import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";
import * as atomicswaps from "@/services/database/atomic-swaps.ts";
import type { AtomicSwap } from "@/services/indexer/src/tx/parse.d.ts";
import { DEFAULT_PAGINATION_LIMIT } from "@/services/database/utils/pagination.ts";
import type { PaginatedResult } from "@/services/database/utils/pagination.d.ts";


export const controller = {
    getAtomicSwaps: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : DEFAULT_PAGINATION_LIMIT;
            const result = await atomicswaps.getAtomicSwaps({ page, limit });
            return handleSuccess<PaginatedResult<AtomicSwap>>(res, result);
        } catch (error: unknown) {
            console.error(error);
            return handleError(res, error as Error);
        }
    },
    getAtomicSwapByTxId: async (req: Request, res: Response) => {
        try {
            const result = await atomicswaps.getAtomicSwapByTxId(req.params.txId);
            return handleSuccess<{
                result: AtomicSwap[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getAtomicSwapByAsset: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : DEFAULT_PAGINATION_LIMIT;
            const result = await atomicswaps.getAtomicSwapByAsset(req.params.asset, { page, limit });
            return handleSuccess<{
                result: AtomicSwap[],
                total: number,
                page: number,
                limit: number,
                totalPages: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getAtomicSwapByAddress: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : DEFAULT_PAGINATION_LIMIT;
            const result = await atomicswaps.getAtomicSwapByAddress(req.params.address, { page, limit });
            return handleSuccess<{
                result: AtomicSwap[],
                total: number,
                page: number,
                limit: number,
                totalPages: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getUniqueAddresses: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : DEFAULT_PAGINATION_LIMIT;
            const result = await atomicswaps.getUniqueAddresses({ page, limit });
            return handleSuccess<{
                result: string[],
                total: number,
                page: number,
                limit: number,
                totalPages: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getUniqueAddressesByType: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : DEFAULT_PAGINATION_LIMIT;
            const type = req.params.type as "seller" | "buyer";
            if (!["seller", "buyer"].includes(type)) {
                return handleError(res, new Error("Invalid type"));
            }
            const result = await atomicswaps.getUniqueAddressesByType(type, { page, limit });
            return handleSuccess<{
                result: string[],
                total: number,
                page: number,
                limit: number,
                totalPages: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    }
}

export function configureMarketDataRoutes(router: Router) {
    router.get("/", controller.getAtomicSwaps);
    router.get("/tx/:txId", controller.getAtomicSwapByTxId);
    router.get("/asset/:asset", controller.getAtomicSwapByAsset);
    router.get("/address/:address", controller.getAtomicSwapByAddress);
    router.get("/addresses", controller.getUniqueAddresses);
    router.get("/addresses/:type", controller.getUniqueAddressesByType);
    return router;
}
