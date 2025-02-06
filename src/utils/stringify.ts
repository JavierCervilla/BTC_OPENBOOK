import * as bitcoin from "bitcoinjs-lib";
import { apiLogger } from "@/utils/logger.ts";

export function safeStringify<T>(data: T): string {
    try {
        return JSON.stringify(data, (_key, value) => {
            if (typeof value === 'bigint') return value.toString();
            if (value instanceof bitcoin.Psbt) return value.toHex();
            return value;
        }, 2);
    } catch (error) {
        apiLogger.error("Error stringifying data:", error);
        throw new Error("Data serialization error");
    }
}