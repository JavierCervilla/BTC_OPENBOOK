import { Database } from "@db/sqlite";
import { CONFIG } from "@/config/index.ts";
import type { OpenBookListing } from "@/services/indexer/src/tx/parse.d.ts";

export async function getOpenbookListings() {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const openbook_listings = await db.prepare("SELECT * FROM openbook_listings").all();
    db.close();
    return {
        result: openbook_listings,
        total: openbook_listings.length
    };
}

export async function getOpenbookListingsByTxId(txId: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const openbook_listings = await db.prepare("SELECT * FROM openbook_listings WHERE txid = ?").get(txId);
    db.close();
    return {
        result: openbook_listings
    };
}

export async function getOpenbookListingsByAsset(asset: string): Promise<{ result: OpenBookListing[], total: number }> {
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
            )
        `;
        const openbook_listings_result = await db.prepare(query).all([asset]);

        const openbook_listings = openbook_listings_result.map((listing) => {
            return {
                ...listing,
                utxo_balance: JSON.parse(listing.utxo_balance as string)
            };
        });

        return {
            result: openbook_listings,
            total: openbook_listings.length
        };
    } catch (error) {
        console.error("Error getting openbook listings by asset:", error);
        return {
            result: [],
            total: 0
        };
    } finally {
        db.close();
    }
}

export async function getOpenbookListingsByAddress(address: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const atomicSwap = await db.prepare("SELECT * FROM openbook_listing WHERE seller = ? ").all(address);
    db.close();
    return {
        result: atomicSwap,
        total: atomicSwap.length
    };
}