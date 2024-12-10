import express from "express";
import type { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";

import { docsLoader } from "@/loaders/docs.ts";
//import { apiKeyMiddleware } from "@/auth/middleware.ts";


export function expressLoader({ app }: { app: Application }) {
    const router = express.Router();
    app.get('/health', (_req: Request, res: Response) => res.status(200).json({status:'ok'}));
    app.head('/health', (_req: Request, res: Response) => res.status(200).json({status:'ok'}))
    app.enable('trust proxy');
    app.use(cors());
    app.use(express.json());
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
    
    //app.use("/api/v1/orderbook"/*, apiKeyMiddleware*/, configurateOrderbookRoutes(router));
    
    //docsLoader(app);
    console.log('🚀 Express Initialized');
    return app;
}
export default expressLoader;