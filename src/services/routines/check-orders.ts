import { cronLogger } from "@/utils/logger.ts";
import { CONFIG } from "@/config/index.ts";
import * as Order from "@/services/database/orders.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";

const CHECK_INTERVAL_MS = 5000;

async function checkOrder(order: OpenBookListing) {
    const { utxo } = order;
    const [txid, vout] = utxo.split(':');
    const orderIdSnippet = `${order.txid.slice(0, 6)}...${order.txid.slice(-6)}`;
    const utxoSnippet = `${utxo.slice(0, 6)}...${utxo.slice(-6)}`;

    cronLogger.info(`Checking order ${orderIdSnippet} with UTXO ${utxoSnippet}`);
    
    let checked = false;
    while (!checked) {
        try {
            const tx = await rpc.getTXOUT(txid, Number(vout));
            if (!tx) {
                cronLogger.error(`TXOUT not found for order ${orderIdSnippet}. UTXO ${utxoSnippet} has been spent`);
                await Order.updateOpenbookListing(order.txid, 'inactive');
                checked = true;
            } else {
                cronLogger.info(`Order ${orderIdSnippet} with UTXO ${utxoSnippet} is still active`);
                checked = true;
            }
        } catch (error) {
            cronLogger.error(`Error checking order ${orderIdSnippet}. UTXO ${utxoSnippet}: ${error}`);
            await delay(CHECK_INTERVAL_MS);
        }
    }
}

async function checkOrders() {
    try {
        const start = new Date();
        cronLogger.info(`[${start.toISOString()}] CHECK ORDERS CRON STARTED`);
        
        const orders = await Order.getOpenbookListingsByStatus('active');
        if (!orders || orders.length === 0) {
            cronLogger.warn("No active orders found to check");
            return;
        }

        cronLogger.info(`[${new Date().toISOString()}] Connected to database. ${orders.length} orders to check`);
        await Promise.all(orders.map(order => checkOrder(order)));
    } catch (error) {
        cronLogger.error(`Error in checkOrders: ${error}`);
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.cron("check-orders", CONFIG.CRON.CHECK_ORDERS_CRON, checkOrders);