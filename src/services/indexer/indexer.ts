import type { Database } from "@db/sqlite";
import { InitialPrompt, logger } from "@/utils/logger.ts";
import { getNextBlock } from "./src/db/methods.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import * as parser from "@/services/indexer/src/tx/parse.ts";
import { CONFIG } from "@/config/index.ts";

export async function initializeIndexer(db: Database) {
    const nextBlock = await getNextBlock(db);
    let endBlock = await rpc.getBlockCount();


    let block = nextBlock;
    while (true) {
        if (block <= endBlock) {
            const start = new Date();
            logger.info(`[${start.toISOString()}] Start processing Block ${block}`);

            const blockInfo = await rpc.getBlock(block);
            const { atomic_swaps } = await parser.parseBlock(db, blockInfo);
            let transactions: Transaction[] = [];
            if (block >= CONFIG.INDEXER.START_OPENBOOK_LISTINGS_BLOCK) {
                transactions = await rpc.getMultipleTransactions(blockInfo.tx, true, 1000);
            }

            const end = new Date();
            logger.info(`[${end.toISOString()}] Block ${block} processed ${atomic_swaps.length} transactions in ${(end.getTime() - start.getTime()) / 1000}s ${atomic_swaps.length} atomic swaps`);
            block++;
        }

        if (block > endBlock) {
            const newEndBlock = await rpc.getBlockCount();
            if (newEndBlock > endBlock) {
                endBlock = newEndBlock;
            } else {
                logger.info("No new blocks found sleeping for 10 seconds");
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
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
