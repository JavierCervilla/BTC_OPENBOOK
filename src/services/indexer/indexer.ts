import type { Database } from "@db/sqlite";
import { InitialPrompt, logger } from "@/utils/logger.ts";
import { getNextBlock } from "./src/db/methods.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import * as parser from "@/services/indexer/src/tx/parse.ts";

export async function initializeIndexer(db: Database) {
    let block = await getNextBlock(db);
    let endBlock = await rpc.getBlockCount();

    logger.debug(`[${new Date().toISOString()}] Starting sync: Next block: ${block}, End block: ${endBlock}`);

    const topics = ["blocks"];
    rpc.subscribeToMempoolSpaceWebSocket(["blocks"], {
        onMessage: (message) => {
            if (message.block) {
                endBlock = Math.max(endBlock, message.block.height);
                logger.info(`New block detected via WebSocket the tip now is ${message.block.height}`);
            }
        },
        onConnect: async () => {
            endBlock = await rpc.getBlockCount();
            logger.info(`WebSocket connected. [${endBlock}]`);
        },
        onError: (_error) => {},
        onClose: () => {}
    });

    while (true) {
        while (block <= endBlock) {
            const start = new Date();
            try {
                const blockInfo = await rpc.getBlock(block);
                const { atomic_swaps, openbook_listings } = await parser.parseBlock(db, blockInfo);
                const end = new Date();
                logger.info(
                    `[${end.toISOString()}] Block ${block} / ${endBlock} (${atomic_swaps.length + openbook_listings.length} Txs - ${atomic_swaps.length} Swaps - ${openbook_listings.length} Listings) [${(
                        (end.getTime() - start.getTime()) /
                        1000
                    ).toFixed(3)}s]`
                );
                block++;
            } catch (error: unknown) {
                logger.error(`Error processing block ${block}: ${error}`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        logger.info(`[${new Date().toISOString()}] No new blocks to process. Waiting for updates...`);
        while (block > endBlock) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}


export async function start(db: Database) {
    try {
        InitialPrompt();
        await initializeIndexer(db);

    } catch (error) {
        logger.critical(error);
    }
}
