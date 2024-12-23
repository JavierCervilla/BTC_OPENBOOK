import type { Database } from "@db/sqlite";

import { CONFIG } from "@/config/index.ts";
import logger from "@/utils/logger.ts";
import type { ParsedTransaction, OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";
import { safeStringify } from "@/utils/stringify.ts";

let CACHED_LAST_BLOCK: number;

export async function getNextBlock(db: Database): Promise<number> {
    try {
        if (CACHED_LAST_BLOCK !== undefined) {
            return CACHED_LAST_BLOCK + 1;
        }
        const stmt = await db.prepare('SELECT MAX(block_index) as start_block FROM blocks');
        const nextBlockQuery = stmt.get() as { start_block: number | null };

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
    block_time: string | Date;
    transactions: string;
    events: string;
}

export function storeBlockData(db: Database, blockInfo: BlockInfo) {
    try {
        const stmt = db.prepare('INSERT INTO blocks (block_index, block_time, transactions, events) VALUES (?,?,?,?)')
        stmt.run(
            blockInfo.block_index,
            blockInfo.block_time,
            blockInfo.transactions,
            blockInfo.events
        );
    } catch (error) {
        logger.error("Error storing block data:", error);
        throw error;
    }
}

export function storeAtomicSwaps(db: Database, atomic_swaps: ParsedTransaction[]) {
    try {
        const stmt = db.prepare(
            'INSERT INTO atomic_swaps (txid, timestamp, block_hash, block_index, seller, buyer, total_price, unit_price, service_fees, utxo_balance) VALUES (?,?,?,?,?,?,?,?,?,?)',
        );
        for (const swap of atomic_swaps) {
            stmt.run(
                swap.txid,
                swap.timestamp,
                swap.block_hash,
                swap.block_index,
                swap.seller,
                swap.buyer,
                swap.total_price,
                swap.unit_price,
                safeStringify(swap.service_fees),
                safeStringify(swap.utxo_balance)
            );
        }
    } catch (error) {
        logger.error("Error storing atomic swaps:", error);
        throw error;
    }
}

export function storeOpenbookListings(db: Database, openbook_listings: OpenBookListing[]) {
    try {
        const stmt = db.prepare('INSERT INTO openbook_listings (txid, timestamp, block_index, utxo, price, seller, psbt, utxo_balance) VALUES (?,?,?,?,?,?,?,?)');
        for (const listing of openbook_listings) {
            stmt.run(listing.txid, listing.timestamp, listing.block_index, listing.utxo, listing.price, listing.seller, listing.psbt, listing.utxo_balance);
        }
    } catch (error) {
        logger.error("Error storing openbook listings:", error);
        throw error;
    }
}