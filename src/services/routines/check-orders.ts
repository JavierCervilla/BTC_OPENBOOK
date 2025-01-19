import { cronLogger } from "@/utils/logger.ts";
import { CONFIG } from "@/config/index.ts";
import * as Order from "@/services/database/orders.ts";

import * as rpc from "@/utils/btc/rpc.ts";

async function checkOrders() {
    try{
        const start = new Date();
        cronLogger.info(`[${start.toISOString()}] CHECK ORDERS CRON STARTED`);
        const orders = await Order.getOpenbookListingsByStatus('active');
        if (!orders) {
            throw new Error("No orders found to check");
        }
        cronLogger.info(`[${new Date().toISOString()}] Connected to database. ${orders?.length} orders to check`);
        for (const order of orders) {
            const {utxo} = order;
            const [txid, vout] = utxo.split(':');
            cronLogger.info(`Checking order ${order.txid} with UTXO ${utxo}`);
            const tx = await rpc.getTXOUT(txid, Number(vout));
            if (!tx) {
                cronLogger.error(`TXOUT not found for order ${order.txid}. UTXO ${utxo} has been spent`);
                await Order.updateOpenbookListing(order.txid, 'inactive');
            }
        }
    } catch(error){
        cronLogger.error(error);
    }
}


Deno.cron("check-orders", CONFIG.CRON.CHECK_ORDERS_CRON, checkOrders);