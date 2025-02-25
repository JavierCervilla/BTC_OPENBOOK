import { Database } from "@db/sqlite";
import { CONFIG } from "@/config/index.ts";
import type { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";
import type { PaginatedResult, PaginationOptions } from "@/services/database/utils/pagination.d.ts";
import * as paginate from "@/services/database/utils/pagination.ts";

export async function getOpenbookListings(options: PaginationOptions): Promise<PaginatedResult<OpenBookListing>> {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    try {
        const baseQuery = "SELECT *, json(utxo_balance) as utxo_balance FROM openbook_listings";
        const query = paginate.buildPaginatedQuery(baseQuery, options);

        const openbook_listings = await db.prepare(query).all();
        const total = await paginate.getTotalCount(db, baseQuery);
        return {
            page: options.page,
            limit: options.limit,
            total,
            totalPages: Math.ceil(total / options.limit),
            result: openbook_listings as OpenBookListing[],
        };
    } catch {
        return {
            page: options.page,
            limit: options.limit,
            total: 0,
            totalPages: 0,
            result: [],
        };
    } finally {
        db.close();
    }
}

export async function getOpenbookListingsByStatus(status: 'active' | 'inactive'): Promise<OpenBookListing[] | null> {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    try {
        const query = "SELECT *, json(utxo_balance) as utxo_balance FROM openbook_listings WHERE status = ?";
        const openbook_listings = await db.prepare(query).all(status);
        return openbook_listings as OpenBookListing[];
    } catch(_error) {
        return null;
    } finally {
        db.close();
    }
}

export async function getOpenbookListingsByTxId(txId: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    try {
        const openbook_listing = await db.prepare("SELECT *, json(utxo_balance) as utxo_balance FROM openbook_listings WHERE txid = ?").get(txId);

        return {
            result: openbook_listing as OpenBookListing
        };
    } catch {
        return {
            result: null
        };
    } finally {
        db.close();
    }
}

export async function getOpenbookListingsByAsset(asset: string, options: PaginationOptions): Promise<PaginatedResult<OpenBookListing>> {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });

    try {
        const query = `
            SELECT *
            FROM openbook_listings
            WHERE EXISTS (
                SELECT 1
                FROM json_each(openbook_listings.utxo_balance) AS j
                WHERE json_extract(j.value, '$.assetId') = ?
            ) ORDER BY block_index DESC
        `;
        const paginatedQuery = paginate.buildPaginatedQuery(query, options);
        const openbook_listings_result = await db.prepare(paginatedQuery).all([asset]);

        const total = await paginate.getTotalCount(db, paginatedQuery, [asset]);
        const openbook_listings = openbook_listings_result.map((listing) => {
            return {
                ...listing,
                utxo_balance: JSON.parse(listing.utxo_balance as string)
            } as OpenBookListing;
        });

        return {
            page: options.page,
            limit: options.limit,
            total,
            totalPages: Math.ceil(total / options.limit),
            result: openbook_listings,
        };
    } catch {
        return {
            page: options.page,
            limit: options.limit,
            total: 0,
            totalPages: 0,
            result: [],
        };
    } finally {
        db.close();
    }
}

export async function getOpenbookListingsByAddress(address: string, options: PaginationOptions): Promise<PaginatedResult<OpenBookListing>> {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    try {
        const query = "SELECT *, json(utxo_balance) as utxo_balance FROM openbook_listings WHERE seller = ? ";
        const paginatedQuery = paginate.buildPaginatedQuery(query, options);
        const openbook_listings = await db.prepare(paginatedQuery).all([address]);
        const total = await paginate.getTotalCount(db, query, [address]);
        return {
            page: options.page,
            limit: options.limit,
            total,
            totalPages: Math.ceil(total / options.limit),
            result: openbook_listings as OpenBookListing[],
        };
    } catch {
        return {
            page: options.page,
            limit: options.limit,
            total: 0,
            totalPages: 0,
            result: [],
        };
    } finally {
        db.close();
    }
}

export async function updateOpenbookListing(txid: string, status: 'active' | 'inactive'): Promise<boolean> {
    const db = new Database(CONFIG.DATABASE.DB_NAME);
    try {
        await db.prepare("UPDATE openbook_listings SET status = ? WHERE txid = ?").run(status, txid);
        return true;
    } catch {
        return false;
    } finally {
        db.close();
    }
}