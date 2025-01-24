import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";

import * as xcp from "@/services/counterparty/index.ts";



export const controller = {
    attach: async (req: Request, res: Response) => {
        try {
            const { asset, address, feeRate, quantity } = req.body;
            const result = await xcp.attach({ asset, address, feeRate, quantity });
            return handleSuccess(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
    detach: async (req: Request, res: Response) => {
        try {
            const { utxo, address, feeRate } = req.body;
            const result = await xcp.detach({ utxo, address, feeRate });
            return handleSuccess(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    }
}

export function configureCounterpartyRoutes(router: Router) {
    router.post("/attach", controller.attach);
    router.post("/detach", controller.detach);
    return router;
}
