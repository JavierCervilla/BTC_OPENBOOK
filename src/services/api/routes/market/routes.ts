import type { Router, Request, Response } from "express";
import marketDataService from "@/services/market/data.ts";
import { handleSuccess, handleError } from "@/services/api/handler.ts";
import { MarketData } from "@/services/market/data.d.ts";

export const controller = {
    getMarketData: async (_req: Request, res: Response) => {
        try {
            const result = await marketDataService.getMarketData();
            return handleSuccess<MarketData[]>(res, result);
        } catch (error: unknown) {
            return handleError(res, error as Error);
        }
    },
}



export function configureMarketRoutes(router: Router) {
    router.get("/", controller.getMarketData);
    return router;
}