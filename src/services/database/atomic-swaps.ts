import { Database } from "@db/sqlite";
import { CONFIG } from "@/config/index.ts";

export async function getAtomicSwaps() {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const atomicSwaps = await db.prepare("SELECT * FROM atomic_swaps").all();
    db.close();
    return {
        result: atomicSwaps,
        total: atomicSwaps.length
    };
}

export async function getAtomicSwapByTxId(txId: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const atomicSwaps = await db.prepare("SELECT * FROM atomic_swaps WHERE txid = ?").all(txId);
    db.close();
    return {
        result: atomicSwaps,
        total: atomicSwaps.length
    };
}

export async function getAtomicSwapByAsset(asset: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const atomicSwap = await db.prepare("SELECT * FROM atomic_swaps WHERE assetid = ?").all(asset);
    db.close();
    return {
        result: atomicSwap,
        total: atomicSwap.length
    };
}

export async function getAtomicSwapByAddress(address: string) {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const atomicSwap = await db.prepare("SELECT * FROM atomic_swaps WHERE seller = ? OR buyer = ? OR service_fee_recipient = ?").all(address, address, address);
    db.close();
    return {
        result: atomicSwap,
        total: atomicSwap.length
    };
}

export async function getUniqueAddresses() {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = await db.prepare(`
        SELECT DISTINCT seller AS address FROM atomic_swaps
        UNION
        SELECT DISTINCT buyer AS address FROM atomic_swaps
        UNION
        SELECT DISTINCT service_fee_recipient AS address FROM atomic_swaps
    `).all();
    db.close();

    const addresses = query.map((row: Record<"address", string>) => row.address).filter(Boolean);
    return {
        result: addresses,
        total: addresses.length
    };
}

export async function getUniqueAddressesByType(type: "seller" | "buyer") {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = await db.prepare(`SELECT DISTINCT ${type} as address FROM atomic_swaps`).all();
    const addresses = query.map((row: Record<"address", string>) => row.address).filter(Boolean);
    db.close();
    return {
        result: addresses,
        total: addresses.length
    };
}