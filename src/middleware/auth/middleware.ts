import { createHash, } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { API_KEY_HASHES } from "@/lib/auth/index.ts";

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
        return res.status(401).json({ error: "API key is missing" });
    }
    const hash = createHash("sha256").update(apiKey).digest("hex");
    if (!API_KEY_HASHES.includes(hash)) {
        return res.status(403).json({ error: "Invalid API key" });
    }
    next();
}