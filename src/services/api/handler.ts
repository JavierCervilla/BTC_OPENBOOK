import type { Response } from "express";
import { apiLogger } from "@/utils/logger.ts";
import { safeStringify } from "@/utils/stringify.ts";


export function handleSuccess<T>(res: Response, data: T) {
    const jsonData = safeStringify(data);
    res.status(200).type('application/json').send(jsonData);
}

export function handleError(res: Response, error: Error) {
    apiLogger.error(error);
    if (error instanceof Error) {
        res.status(500).json({ error: error.message.split("\n")[0] });
    } else {
        res.status(500).json({ error: "Unknown error" });
    }
}