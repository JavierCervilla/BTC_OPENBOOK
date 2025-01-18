import type { Database } from "@db/sqlite";
import { InitialPrompt, logger } from "@/utils/logger.ts";
import { getNextBlock } from "./src/db/methods.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import * as parser from "@/services/indexer/src/tx/parse.ts";

export async function initializeIndexer(db: Database) {
    const nextBlock = await getNextBlock(db);
    let endBlock = await rpc.getBlockCount();
    logger.debug(`[${new Date().toISOString()}] Next block: ${nextBlock} - End block: ${endBlock}`)

    let block = nextBlock;
    while (true) {
        if (block <= endBlock) {
            const start = new Date();
            const blockInfo = await rpc.getBlock(block);
            const { atomic_swaps, openbook_listings } = await parser.parseBlock(db, blockInfo);
            const end = new Date();
            logger.info(`[${end.toISOString()}] Block ${block} (${atomic_swaps.length + openbook_listings.length} Txs - ${atomic_swaps.length} Swaps - ${openbook_listings.length} Listings) [${(Number(end.getTime() - start.getTime()) / 1000).toFixed(3)}s]`);
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
