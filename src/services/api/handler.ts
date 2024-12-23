import type { Response } from "express";
import * as bitcoin from "bitcoinjs-lib";
import { apiLogger } from "@/utils/logger.ts";


function safeStringify<T>(data: T): string {
    try {
        return JSON.stringify(data, (_key, value) => {
            if (typeof value === 'bigint') return value.toString();
            if (value instanceof bitcoin.Psbt) return value.toHex();
            return value;
        });
    } catch (error) {
        apiLogger.error("Error stringifying data:", error);
        throw new Error("Data serialization error");
    }
}

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