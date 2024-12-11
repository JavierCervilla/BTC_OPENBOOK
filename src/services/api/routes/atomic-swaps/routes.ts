import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";
import * as atomicswaps from "@/services/database/atomic-swaps.ts";
import type { AtomicSwap } from "@/services/indexer/src/tx/parse.d.ts";


export const controller = {
    getAtomicSwaps: async (req: Request, res: Response) => {
        try {
            const result = await atomicswaps.getAtomicSwaps();
            return handleSuccess<{
                result: AtomicSwap[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
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
            const result = await atomicswaps.getAtomicSwapByAsset(req.params.asset);
            return handleSuccess<{
                result: AtomicSwap[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getAtomicSwapByAddress: async (req: Request, res: Response) => {
        try {
            const result = await atomicswaps.getAtomicSwapByAddress(req.params.address);
            return handleSuccess<{
                result: AtomicSwap[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getUniqueAddresses: async (req: Request, res: Response) => {
        try {
            const result = await atomicswaps.getUniqueAddresses();
            return handleSuccess<{
                result: string[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    getUniqueAddressesByType: async (req: Request, res: Response) => {
        try {
            const type = req.params.type as "seller" | "buyer";
            if (!["seller", "buyer"].includes(type)) {
                return handleError(res, new Error("Invalid type"));
            }
            const result = await atomicswaps.getUniqueAddressesByType(type);
            return handleSuccess<{
                result: string[],
                total: number
            }>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    }
}

export function configureMarketDataRoutes(router: Router) {
    router.get("/atomic-swaps", controller.getAtomicSwaps);
    router.get("/atomic-swaps/tx/:txId", controller.getAtomicSwapByTxId);
    router.get("/atomic-swaps/asset/:asset", controller.getAtomicSwapByAsset);
    router.get("/atomic-swaps/address/:address", controller.getAtomicSwapByAddress);
    router.get("/atomic-swaps/addresses", controller.getUniqueAddresses);
    router.get("/atomic-swaps/addresses/:type", controller.getUniqueAddressesByType);
    return router;
}
