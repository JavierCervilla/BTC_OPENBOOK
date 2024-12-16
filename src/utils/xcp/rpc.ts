import { CONFIG } from "@/config/index.ts";
import type { XCPEvent } from "./rpc.d.ts";
import { apiLogger } from "@/utils/logger.ts";

export async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Retry failed");
}


function getUtxoMoveAdapter(event: XCPEvent) {
    return {
        txid: event.tx_hash,
        timestamp: event.params.block_time,
        seller: event.params.source,
        buyer: event.params.destination,
        qty: Number(event.params.quantity_normalized),
        assetId: event.params.asset,
        openbook: false,
        block_index: event.params.block_index,
        block_hash: "",
    }
}


export async function getEventsByBlock(block: number, event = "UTXO_MOVE") {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/blocks/${block}/events`);
    endpoint.searchParams.set("event_name", event);
    endpoint.searchParams.set("limit", "5000");
    endpoint.searchParams.set("verbose", "true");


    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    return data.result.map(getUtxoMoveAdapter);
}

export async function getUTXOBalance(utxo: string) {
    try {
        const url = new URL(`${CONFIG.XCP.RPC_URL}/v2/utxos/${utxo}/balances`);
        url.searchParams.set("verbose", "true");
        const endpoint = url.toString();
        const response = await fetch(endpoint, { method: "GET" });
        apiLogger.info(`${endpoint} [${response.status}]`);
        const { result } = await response.json();
        return result;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}