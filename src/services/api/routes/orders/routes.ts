import type { Router, Request, Response } from "express";

import { handleSuccess, handleError } from "@/services/api/handler.ts";
import * as paginate from "@/services/database/utils/pagination.ts";
import * as orders from "@/services/database/orders.ts";
import type { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";
import type { PaginatedResult } from "@/services/database/utils/pagination.d.ts";

export const controller = {
    getOpenbookListings: async (req: Request, res: Response) => {
        try {
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : paginate.DEFAULT_PAGINATION_LIMIT;
            const result = await orders.getOpenbookListings({ page, limit });
            return handleSuccess<PaginatedResult<OpenBookListing>>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },

    getOpenbookListingsByTxId: async (req: Request, res: Response) => {
        try {
            const { txId } = req.params;
            const result = await orders.getOpenbookListingsByTxId(txId);
            return handleSuccess<{
                result: OpenBookListing,
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },

    getOpenbookListingsByAsset: async (req: Request, res: Response) => {
        try {
            const { asset } = req.params;
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : paginate.DEFAULT_PAGINATION_LIMIT;
            const result = await orders.getOpenbookListingsByAsset(asset, { page, limit });
            return handleSuccess<PaginatedResult<OpenBookListing>>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getOpenbookListingsByAddress: async (req: Request, res: Response) => {
        try {
            const { address } = req.params;
            const { query } = req;
            const page = query.page ? Number.parseInt(query.page as string) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string) : paginate.DEFAULT_PAGINATION_LIMIT;
            const result = await orders.getOpenbookListingsByAddress(address, { page, limit });
            return handleSuccess<PaginatedResult<OpenBookListing>>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    }


    //createOrder: async (req: Request, res: Response) => {
    //    try {
    //        const { body } = req;
    //        const result = await orders.createOrder(body);
    //        return handleSuccess<{
    //            result: Order,
    //            total: number
    //        }>(res, result);
    //    } catch (error: unknown) {
    //        return handleError(res, error as Error);
    //    }
    //}
}

export function configureOpenBookRoutes(router: Router) {
    router.get("/", controller.getOpenbookListings);
    router.get("/:txId", controller.getOpenbookListingsByTxId);
    router.get("/asset/:asset", controller.getOpenbookListingsByAsset);
    router.get("/address/:address", controller.getOpenbookListingsByAddress);
    return router;
}
