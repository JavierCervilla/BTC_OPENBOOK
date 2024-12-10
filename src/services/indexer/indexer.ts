import cliProgress from "cli-progress";

import { CONFIG } from "@/config/index.ts";
import type { Database } from "@db/sqlite";
import { InitialPrompt, logger } from "@/utils/logger.ts";
import { getNextBlock, storeAtomicSwaps, storeBlockData } from "./src/db/methods.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import * as parser from "@/services/indexer/src/tx/parse.ts";
import * as progress from "@/utils/progress.ts";
import { executeAtomicOperations } from "@/services/indexer/src/db/methods.ts";

export async function initializeIndexer(db: Database) {
    const nextBlock = await getNextBlock(db);
    let endBlock = await rpc.getBlockCount();


    let block = nextBlock;
    while (true) {
        if (block <= endBlock) {
            const start = new Date();
            logger.info(`[${start.toISOString()}] Start processing Block ${block}`);

            const blockInfo = await rpc.getBlock(block);
            const { tx: txs } = blockInfo;
            const total = txs.length;
            let completed = 0;

            progress.initProgress(total);
            const transactions = await Promise.all(txs.map(async (txid) => {
                const transaction = await parser.parseTxForAtomicSwap(txid);
                completed++;
                progress.updateProgress(completed, total);
                return transaction;
            }));
            progress.finishProgress();

            const atomic_swaps = transactions.filter(Boolean);
            executeAtomicOperations(db, (db) => {
                try {
                    storeBlockData(db, {
                        block_index: blockInfo.height,
                        block_hash: blockInfo.hash,
                        block_time: blockInfo.time,
                        transactions: JSON.stringify(atomic_swaps.map((swap) => swap.txid))
                    });
                    storeAtomicSwaps(db, atomic_swaps);
                } catch (error) {
                    logger.error("Error storing block data or atomic swaps:", error);
                    throw error;
                }
            });

            const end = new Date();
            logger.info(`[${end.toISOString()}] Block ${block} processed in ${(end.getTime() - start.getTime()) / 1000}s ${atomic_swaps.length} atomic swaps`);
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
