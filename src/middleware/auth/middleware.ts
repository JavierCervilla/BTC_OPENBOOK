import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { CONFIG } from "@/config/index.ts";

const partnerConfigMap = new Map<string, Record<string, unknown>>();
Object.keys(CONFIG.PARTNERS.CONFIG).forEach(partner => {
    CONFIG.PARTNERS.CONFIG[partner]["api-key"].forEach((apiKey: string) => {
        const hash = createHash("sha256").update(apiKey).digest("hex");
        partnerConfigMap.set(hash, {
            limitRate: CONFIG.PARTNERS.CONFIG[partner]["limit-rate"],
            serviceFee: CONFIG.PARTNERS.CONFIG[partner]["service-fee"]
        });
    });
});

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"] as string;
    if (!apiKey) {
        return res.status(401).json({ error: "API key is missing" });
    }
    const hash = createHash("sha256").update(apiKey).digest("hex");
    const partnerConfig = partnerConfigMap.get(hash);
    if (!partnerConfig) {
        return res.status(403).json({ error: "Invalid API key" });
    }

    req.partner = partnerConfig;
    next();
}