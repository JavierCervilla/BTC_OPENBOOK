import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";

import { docsLoader } from "@/loaders/docs.ts";
import { configureMarketDataRoutes } from "../services/api/routes/atomic-swaps/routes.ts";
import morganMiddleware from "@/middleware/morgan.ts";
import { configureBlocksRoutes } from "@/services/api/routes/blocks/routes.ts";
//import { apiKeyMiddleware } from "@/auth/middleware.ts";


export function expressLoader({ app }: { app: Application }) {
    const router = express.Router();
    app.get('/health', (_req: Request, res: Response) => res.status(200).json({status:'ok'}));
    app.head('/health', (_req: Request, res: Response) => res.status(200).json({status:'ok'}))
    app.enable('trust proxy');
    app.use(cors());
    app.use(express.json());
    app.use(morganMiddleware);
    
    app.use("/api/v1/sales"/*, apiKeyMiddleware*/, configureMarketDataRoutes(router));
    app.use("/api/v1/blocks"/*, apiKeyMiddleware*/, configureBlocksRoutes(router));
    
    docsLoader(app);
    console.log('🚀 Express Initialized');
    return app;
}
export default expressLoader;