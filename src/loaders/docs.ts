import { TspecDocsMiddleware } from "tspec";
import type { Express } from "express";

export async function docsLoader(app: Express) {
    app.use(await TspecDocsMiddleware());
}