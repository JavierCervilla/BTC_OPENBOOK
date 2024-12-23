import { Database } from "@db/sqlite";
import { CONFIG } from "@/config/index.ts";
import * as paginate from "./utils/pagination.ts";
import type { PaginationOptions } from "@/services/database/utils/pagination.d.ts";
import type { AtomicSwap } from "@/services/indexer/src/tx/parse.d.ts";

export async function getAtomicSwaps(options: PaginationOptions) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = "SELECT *, json(utxo_balance) as utxo_balance, json(service_fees) as service_fees FROM atomic_swaps";
    const paginatedQuery = await paginate.buildPaginatedQuery(query, options);
    const atomicSwaps = await db.prepare(paginatedQuery).all();
    const total = await paginate.getTotalCount(db, query);
    db.close();
    return {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
        result: atomicSwaps as AtomicSwap[],
    };
}

export async function getAtomicSwapByTxId(txId: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const atomicSwaps = await db.prepare("SELECT *, json(utxo_balance) as utxo_balance, json(service_fees) as service_fees FROM atomic_swaps WHERE txid = ?").all(txId);
    db.close();
    return {
        result: atomicSwaps as AtomicSwap[],
        total: atomicSwaps.length
    };
}

export async function getAtomicSwapByAsset(asset: string, options: PaginationOptions = paginate.DEFAULT_PAGINATION_OPTIONS) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = `
        SELECT atomic_swaps.*, json(utxo_balance) as utxo_balance, json(service_fees) as service_fees 
        FROM atomic_swaps
        WHERE EXISTS (
            SELECT 1 FROM json_each(atomic_swaps.utxo_balance)
            WHERE json_each.value->>'assetId' = ?
        )
    `;
    const paginatedQuery = await paginate.buildPaginatedQuery(query, options);
    const atomicSwaps = await db.prepare(paginatedQuery).all(asset);
    const total = await paginate.getTotalCount(db, paginatedQuery, [asset]);
    db.close();

    return {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
        result: atomicSwaps as AtomicSwap[],
    };
}

export async function getAtomicSwapByAddress(address: string, options: PaginationOptions = paginate.DEFAULT_PAGINATION_OPTIONS) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = "SELECT *, json(utxo_balance) as utxo_balance, json(service_fees) as service_fees FROM atomic_swaps WHERE seller = ? OR buyer = ? OR service_fee_recipient = ?";
    const paginatedQuery = await paginate.buildPaginatedQuery(query, options);
    const atomicSwaps = await db.prepare(paginatedQuery).all(address, address, address);
    const total = await paginate.getTotalCount(db, query, [address, address, address]);
    db.close();

    return {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
        result: atomicSwaps as AtomicSwap[],
    };
}

export async function getUniqueAddresses(options: PaginationOptions = paginate.DEFAULT_PAGINATION_OPTIONS) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = `
        SELECT DISTINCT seller AS address FROM atomic_swaps
        UNION
        SELECT DISTINCT buyer AS address FROM atomic_swaps
        UNION
        SELECT DISTINCT service_fee_recipient AS address FROM atomic_swaps
    `;
    const paginatedQuery = await paginate.buildPaginatedQuery(query, options);
    const addressesResult = await db.prepare(paginatedQuery).all();
    const total = await paginate.getTotalCount(db, query);
    db.close();
    const addresses = addressesResult.map((row: Record<"address", string>) => row.address).filter(Boolean);
    
    return {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
        result: addresses,
    };
}

export async function getUniqueAddressesByType(type: "seller" | "buyer", options: PaginationOptions = paginate.DEFAULT_PAGINATION_OPTIONS) {
    if (!["seller", "buyer"].includes(type)) {
        throw new Error("Invalid type");
    }
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = `SELECT DISTINCT ${type} as address FROM atomic_swaps`;
    const paginatedQuery = await paginate.buildPaginatedQuery(query, options);
    const addressesResult = await db.prepare(paginatedQuery).all();
    const total = await paginate.getTotalCount(db, query);
    const addresses = addressesResult.map((row: Record<"address", string>) => row.address).filter(Boolean);
    db.close();

    return {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
        result: addresses,
    };
}