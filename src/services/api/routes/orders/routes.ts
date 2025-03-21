import type { Router, Request, Response } from "express";

import { handleSuccess, handleError } from "@/services/api/handler.ts";
import * as paginate from "@/services/database/utils/pagination.ts";
import * as orders from "@/services/database/orders.ts";
import * as buy from "@/services/buy/buy.ts";
import * as sell from "@/services/ordersbook/sell.ts";
import * as cancel from "@/services/ordersbook/cancel.ts";
import type { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";
import type { PaginatedResult } from "@/services/database/utils/pagination.d.ts";
import { apiKeyMiddleware } from "@/middleware/auth/middleware.ts";
import { CreateBuyPSBTResult, ServiceFee } from "@/services/buy/buy.d.ts";
import { CreateCancelResult } from "@/services/ordersbook/cancel.d.ts";
import { CreateSellOrderResult, SubmitSellOrderResult } from "@/services/ordersbook/sell.d.ts";

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
            } | { result: null }>(res, result);
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
    },
    cancelOrder: async (req: Request, res: Response) => {
        try {
            const { body } = req;
            const result = await cancel.createCancel(body);
            return handleSuccess<CreateCancelResult>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    buyOrder: async (req: Request, res: Response) => {
        try {
            const { body } = req;
            const result = await buy.createBuy({
                ...body,
                serviceFee: [
                    ...body.serviceFee,
                    {
                        concept: 'Openbook serviceFee',
                        address: 'bc1qkjdkyq9sn3fzn480ltjynqmyauptvgryuvnv0z',
                        percentage: 2,
                        threshold: 10000,
                    }] as ServiceFee[]
            });
            return handleSuccess<CreateBuyPSBTResult>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    createOrderPsbt: async (req: Request, res: Response) => {
        try {
            const { body } = req;
            const result = await sell.createSellOrderPsbt(body);
            return handleSuccess<CreateSellOrderResult>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    createListingTx: async (req: Request, res: Response) => {
        try {
            const { body } = req;
            const result = await sell.submitSellOrder(body);
            return handleSuccess<SubmitSellOrderResult>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    }
}

export function configureOpenBookRoutes(router: Router) {
    router.get("/", controller.getOpenbookListings);
    router.get("/:txId", controller.getOpenbookListingsByTxId);
    router.get("/asset/:asset", controller.getOpenbookListingsByAsset);
    router.get("/address/:address", controller.getOpenbookListingsByAddress);
    router.post("/list/sign", controller.createOrderPsbt);
    router.post("/list/submit", controller.createListingTx);
    router.post("/buy", controller.buyOrder);
    router.post("/cancel", controller.cancelOrder);
    return router;
}