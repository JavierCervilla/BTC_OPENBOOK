import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";

import * as btc from "@/utils/btc/rpc.ts";


export const controller = {
    fetchCIP25JSON: async (req: Request, res: Response) => {
        const url = req.query.url as string;
        try {
            if (!url) {
                return handleError(res, new Error("URL is required"));
            }
            const response = await fetch(url, {
                method: "GET",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const result = await response.json();
            return handleSuccess<JSON>(res, result);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return handleError(res, error);
            }
            return handleError(res, new Error("Unknown error"));
        }
    },
    broadcastTx: async (req: Request, res: Response) => {
        try {
            const { body } = req;
            const { tx } = body;
            const result = await btc.broadcastTransaction(tx);
            if (result.error) {
                throw new Error(result.error);
            }
            return handleSuccess<{ tx: string }>(res, result);
        } catch (error) {
            return handleError(res, error as Error);
        }
    },
    getMempoolFees: async (_req: Request, res: Response) => {
        try {
            const result = await btc.getMempoolFees();
            return handleSuccess<MempoolFees>(res, result);
        } catch (error) {
            return handleError(res, error as Error);
        }
    }
}

export function configureUtilsRoutes(router: Router) {
    router.get("/cip25", controller.fetchCIP25JSON);
    router.post("/broadcast", controller.broadcastTx);
    router.get("/mempool-fees", controller.getMempoolFees);
    return router;
}