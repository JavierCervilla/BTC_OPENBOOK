import { CONFIG } from "@/config/index.ts";
import type { UTXOBalance, XCPEvent, XCPEventCount } from "./rpc.d.ts";
import { apiLogger } from "@/utils/logger.ts";


export const EVENT_NAMES = [
    "NEW_BLOCK",
    "NEW_TRANSACTION",
    "NEW_TRANSACTION_OUTPUT",
    "BLOCK_PARSED",
    "TRANSACTION_PARSED",
    "DEBIT",
    "CREDIT",
    "ENHANCED_SEND",
    "MPMA_SEND",
    "SEND",
    "ASSET_TRANSFER",
    "SWEEP",
    "ASSET_DIVIDEND",
    "RESET_ISSUANCE",
    "ASSET_CREATION",
    "ASSET_ISSUANCE",
    "ASSET_DESTRUCTION",
    "OPEN_ORDER",
    "ORDER_MATCH",
    "ORDER_UPDATE",
    "ORDER_FILLED",
    "ORDER_MATCH_UPDATE",
    "BTC_PAY",
    "CANCEL_ORDER",
    "ORDER_EXPIRATION",
    "ORDER_MATCH_EXPIRATION",
    "OPEN_DISPENSER",
    "DISPENSER_UPDATE",
    "REFILL_DISPENSER",
    "DISPENSE",
    "BROADCAST",
    "NEW_FAIRMINTER",
    "FAIRMINTER_UPDATE",
    "NEW_FAIRMINT",
    "ATTACH_TO_UTXO",
    "DETACH_FROM_UTXO",
    "UTXO_MOVE",
    "BURN",
    "BET_EXPIRATION",
    "BET_MATCH",
    "BET_MATCH_EXPIRATION",
    "BET_MATCH_RESOLUTON",
    "BET_MATCH_UPDATE",
    "BET_UPDATE",
    "CANCEL_BET",
    "INCREMENT_TRANSACTION_COUNT",
    "INVALID_CANCEL",
    "NEW_ADDRESS_OPTIONS",
    "OPEN_BET",
    "OPEN_RPS",
    "RPS_EXPIRATION",
    "RPS_MATCH",
    "RPS_MATCH_EXPIRATION",
    "RPS_MATCH_UPDATE",
    "RPS_RESOLVE",
    "RPS_UPDATE",
];

export async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (_error) {
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


export async function getSpecificEventsByBlock(block: number, event = "UTXO_MOVE") {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/blocks/${block}/events`);
    endpoint.searchParams.set("event_name", event);
    endpoint.searchParams.set("limit", "5000");
    endpoint.searchParams.set("verbose", "true");


    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    return data.result.map(getUtxoMoveAdapter);
}



function getEventsCountAdapter(eventList: XCPEventCount[]) {
    const eventCounts: Record<string, number> = {};
    for (const event of EVENT_NAMES) {
        eventCounts[event] = 0;
    }
    for (const event of eventList) {
        eventCounts[event.event] = event.event_count;
    }
    return eventCounts;
}

export async function getEventsCountByBlock(block: number) {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/blocks/${block}/events/counts`);
    endpoint.searchParams.set("verbose", "true");
    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    return getEventsCountAdapter(data.result);
}

export async function getUTXOBalance(utxo: string): Promise<UTXOBalance[]> {
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