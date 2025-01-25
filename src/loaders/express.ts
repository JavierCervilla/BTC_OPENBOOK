import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import * as path from "@std/path";

import { docsLoader } from "@/loaders/docs.ts";
import { configureMarketDataRoutes } from "../services/api/routes/atomic-swaps/routes.ts";
import morganMiddleware from "@/middleware/morgan.ts";
import { configureBlocksRoutes } from "@/services/api/routes/blocks/routes.ts";
import { configureOpenBookRoutes } from "@/services/api/routes/orders/routes.ts";
import { configureCounterpartyRoutes } from "@/services/api/routes/counterparty/routes.ts";
import { configureChartRoutes } from "@/services/charts/routes.ts";



export function expressLoader({ app }: { app: Application }) {
    app.use('/static', express.static(path.resolve(Deno.cwd(), 'static')));
    app.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok' }));
    app.head('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok' }))
    app.enable('trust proxy');
    app.use(cors());
    app.use(express.json());
    app.use(morganMiddleware);

    app.use("/api/v1/atomic-swaps", configureMarketDataRoutes(express.Router()));
    app.use("/api/v1/blocks", configureBlocksRoutes(express.Router()));
    app.use("/api/v1/orders", configureOpenBookRoutes(express.Router()));
    app.use("/api/v1/xcp", configureCounterpartyRoutes(express.Router()));
    app.use("/api/v1/charts", configureChartRoutes(express.Router()));
    docsLoader(app);
    console.log('🚀 Express Initialized');
    return app;
}
export default expressLoader;