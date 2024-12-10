import type { Database } from "@db/sqlite";

import { CONFIG } from "@/config/index.ts";
import logger from "@/utils/logger.ts";

let CACHED_LAST_BLOCK: number;

export async function getNextBlock(db: Database): Promise<number> {
    try {
        if (CACHED_LAST_BLOCK !== undefined) {
            return CACHED_LAST_BLOCK + 1;
        }
        const stmt = await db.prepare('SELECT MAX(block_index) as start_block FROM blocks');
        const nextBlockQuery = stmt.get();

        if (!nextBlockQuery || nextBlockQuery.start_block === null) {
            logger.warn("No blocks found in database");
            CACHED_LAST_BLOCK = CONFIG.INDEXER.START_BLOCK;
            return CACHED_LAST_BLOCK;
        }

        CACHED_LAST_BLOCK = nextBlockQuery.start_block;
        return CACHED_LAST_BLOCK + 1;
    } catch (err) {
        logger.error(err);
        return CONFIG.INDEXER.START_BLOCK;
    }
}


export function executeAtomicOperations(db: Database, operations: (db: Database) => void): void {
    const transaction = db.transaction(() => {
        operations(db);
    });
    transaction();
}

type BlockInfo = {
    block_index: number;
    block_hash: string;
    block_time: number;
    transactions: string;
}

export function storeBlockData(db: Database, blockInfo: BlockInfo) {
    try {
        const stmt = db.prepare('INSERT INTO blocks (block_index, block_hash, block_time, transactions) VALUES (?,?,?,?)')
        stmt.run(
            blockInfo.block_index,
            blockInfo.block_hash,
            blockInfo.block_time,
            blockInfo.transactions
        );
    } catch (error) {
        logger.error("Error storing block data:", error);
        throw error;
    }
}

type AtomicSwap = {
    txid: string;
    timestamp: number;
    seller: string;
    buyer: string;
    total_price: bigint;
    unit_price: bigint;
    qty: bigint;
    protocol: string;
    assetId: string;
    block_index: number;
    block_hash: string;
}

export function storeAtomicSwaps(db: Database, atomic_swaps: AtomicSwap[]) {
    try {
        const stmt = db.prepare(
            'INSERT INTO atomic_swaps (txid, timestamp, block_hash, block_index, seller, buyer, protocol, assetId, qty, total_price, unit_price) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        );
        for (const swap of atomic_swaps) {
            stmt.run(
                swap.txid,
                swap.timestamp,
                swap.block_hash,
                swap.block_index,
                swap.seller,
                swap.buyer,
                swap.protocol,
                swap.assetId,
                swap.qty,
                swap.total_price,
                swap.unit_price,
            );
        }
    } catch (error) {
        logger.error("Error storing atomic swaps:", error);
        throw error;
    }
}