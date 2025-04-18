import { CONFIG } from "@/config/index.ts";
import type { CounterpartyV2Result, DetachParams, UTXOBalance, XCPEvent, XCPEventCount, OpenbookUTXOBalance } from "./rpc.d.ts";
import { apiLogger } from "@/utils/logger.ts";
import { AttachParams } from "@/services/counterparty/attach.d.ts";


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
        source: event.params.source,
        destination: event.params.destination,
    }
}


export async function getSpecificEventsByBlock(block: number, event = "UTXO_MOVE") {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/blocks/${block}/events`);
    endpoint.searchParams.set("event_name", event);
    endpoint.searchParams.set("limit", "5000");
    endpoint.searchParams.set("verbose", "true");


    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    if (data.error) {
        apiLogger.error(data.error);
        throw new Error(data.error);
    }
    return data.result.map(getUtxoMoveAdapter);
}


export async function getSpecificEventsByTXID(txid: number, event = "UTXO_MOVE") {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/transactions/${txid}/events`);
    endpoint.searchParams.set("event_name", event);
    endpoint.searchParams.set("limit", "5000");
    endpoint.searchParams.set("verbose", "true");


    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    if (data.error) {
        apiLogger.error(data.error);
        throw new Error(data.error);
    }
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
    const start = new Date();
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/blocks/${block}/events/counts`);
    endpoint.searchParams.set("verbose", "true");
    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    const end = new Date();
    apiLogger.debug(`${endpoint} [${response.status}] ${end.getTime() - start.getTime()}ms`);
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

export async function getUTXOBalanceFromUTXMoveEvent(txid: string) {
    try {
        const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/transactions/${txid}/events`);
        endpoint.searchParams.set("event_name", "UTXO_MOVE,ATTACH_TO_UTXO");
        endpoint.searchParams.set("verbose", "True");
        console.log(endpoint.toString());
        const response = await retry(() => fetch(endpoint.toString()));
        const data = await response.json();
        const utxo_balances = data.result.map((event: XCPEvent) => {
            return {
                assetId: event.params.asset,
                qty: Number(event.params.quantity_normalized),
                protocol: 0,
                protocol_name: "COUNTERPARTY"
            }
        });
        return utxo_balances as OpenbookUTXOBalance[];
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}

export async function attachAssetToUTXO(params: AttachParams) {
    const { asset, quantity, address, feeRate } = params;
    let response;
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/addresses/${address}/compose/attach`);
    endpoint.searchParams.set("exclude_utxos_with_balances", "true");
    endpoint.searchParams.set("utxo_value", "546");
    endpoint.searchParams.set("asset", asset);
    endpoint.searchParams.set("quantity", quantity.toString());
    endpoint.searchParams.set("sat_per_vbyte", feeRate.toString());
    endpoint.searchParams.set("verbose", "false");

    try {
        response = await retry(() => fetch(endpoint.toString()));
        const data = await response.json();
        return data.result;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    } finally {
        if (response) {
            apiLogger.info(`${endpoint} [${response.status}]`);
        }
    }
}

export async function detachAssetFromUTXO(params: DetachParams) {
    const { utxo, address, feeRate } = params;
    let response;
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/addresses/${address}/compose/detach`);
    endpoint.searchParams.set("exclude_utxos_with_balances", "true");
    endpoint.searchParams.set("utxo_value", "546");
    endpoint.searchParams.set("utxo", utxo);
    endpoint.searchParams.set("sat_per_vbyte", feeRate.toString());
    endpoint.searchParams.set("verbose", "false");

    try {
        response = await retry(() => fetch(endpoint.toString()));
        const data = await response.json();
        return data.result;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    } finally {
        if (response) {
            apiLogger.info(`${endpoint} [${response.status}]`);
        }
    }
}

export async function getUTXOSWithBalances(utxos: string[]) {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2/utxos/withbalances`);
    endpoint.searchParams.set("utxos", utxos.join(","));
    endpoint.searchParams.set("verbose", "true");
    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    return data.result;
}

export async function checkCounterpartyVersion(): Promise<CounterpartyV2Result> {
    const endpoint = new URL(`${CONFIG.XCP.RPC_URL}/v2`);
    const response = await retry(() => fetch(endpoint.toString()));
    const data = await response.json();
    return data.result;
}