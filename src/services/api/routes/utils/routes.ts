import type { Router, Request, Response } from "express";
import { handleSuccess, handleError } from "@/services/api/handler.ts";


export const controller = {
    fetchCIP25JSON: async (req: Request, res: Response) => {
        const url = req.query.url as string;
        try {
            if(!url) {
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
}

export function configureUtilsRoutes(router: Router) {
    router.get("/cip25", controller.fetchCIP25JSON);
    return router;
}