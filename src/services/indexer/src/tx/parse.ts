import logger from "@/utils/logger.ts";
import * as progress from "@/utils/progress.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import { OpenBook } from "@/services/openbook/openbook.ts";
import type { Transaction, VOUT } from "@/utils/btc/rpc.d.ts"
import type { ParsedTransaction } from "@/services/indexer/src/tx/parse.d.ts";
import { executeAtomicOperations, storeAtomicSwaps, storeBlockData } from "@/services/indexer/src/db/methods.ts";
import type { Database } from "@db/sqlite";
import type { XCPUtxoMoveInfo } from "@/utils/xcp/rpc.d.ts";
import { getEventsByBlock } from "@/utils/xcp/rpc.ts";


const DUST_THRESHOLD = 546;

function isDustAmount(value: number): boolean {
    return value * 1e8 === DUST_THRESHOLD;
}

function getAddressFromVout(vout: VOUT): string | undefined {
    return vout.scriptPubKey?.address;
}

function calculateUnitPrice(totalPrice: bigint, quantity: bigint): bigint {
    return BigInt(Math.floor(Number(Number(totalPrice) / Number(quantity))));
}

function hasOPRETURN(transaction: Transaction) {
    return transaction.vout.find((vout: VOUT) => {
        return vout.scriptPubKey?.asm.startsWith("OP_RETURN");
    });
}

function parseOPRETURN(op_ret: string) {
    try {
        const decoded = OpenBook.decode_OP_RETURN({
            protocol: 0,
            message: op_ret,
        });
        return decoded;
    } catch (_error) {
        // ignore
    }
}

async function extractTransactionDetails(
    transaction: Transaction,
    openbook_data: { qty: bigint }
): Promise<{
    seller?: string,
    buyer?: string,
    total_price?: bigint,
    unit_price?: bigint,
    service_fee_recipient: string | null,
    service_fee: bigint | null
} | undefined> {
    let seller: string | undefined;
    let buyer: string | undefined;
    let total_price: bigint | undefined;
    let unit_price: bigint | undefined;
    let service_fee_recipient: string | null = null;
    let service_fee: bigint | null = null;

    const vinAddresses = await getVinAddresses(transaction, (address, isDust) => {
        if (isDust) {
            seller = address;
        } else {
            buyer = address;
        }
    });

    const voutAddresses = new Set<string>();
    for (const vout of transaction.vout) {
        const address = getAddressFromVout(vout);
        if (address) {
            voutAddresses.add(address);
            if (address === seller) {
                total_price = BigInt(Math.round(vout.value * 1e8));
                unit_price = calculateUnitPrice(total_price, openbook_data.qty);
            } else if (address !== buyer) {
                service_fee_recipient = address;
                service_fee = BigInt(Math.round(vout.value * 1e8));
            }
        }
    }

    if (isValidTransaction(seller, buyer, vinAddresses, voutAddresses)) {
        return { seller, buyer, total_price, unit_price, service_fee_recipient, service_fee };
    }
    return undefined;
}

async function getVinAddresses(
    transaction: Transaction,
    assignRoles: (address: string, isDust: boolean) => void
): Promise<Set<string>> {
    const vinAddresses = new Set<string>();
    for (const vin of transaction.vin) {
        const tx = await rpc.getTransaction(vin.txid) as Transaction;
        const vout = tx.vout.find((vout: VOUT) => vout.n === vin.vout);
        if (vout) {
            const address = getAddressFromVout(vout);
            if (address) {
                vinAddresses.add(address);
                assignRoles(address, isDustAmount(vout.value));
            }
        }
    }
    return vinAddresses;
}

function isValidTransaction(
    seller: string | undefined,
    buyer: string | undefined,
    vinAddresses: Set<string>,
    voutAddresses: Set<string>
): boolean {
    if (!seller || !buyer || seller === buyer) {
        return false;
    }
    if (!vinAddresses.has(seller) || !vinAddresses.has(buyer) || !voutAddresses.has(seller) || !voutAddresses.has(buyer)) {
        return false;
    }
    return true;
}
export async function parseTransactionForAtomicSwap(transaction: Transaction): Promise<ParsedTransaction | undefined> {
    const op_ret = hasOPRETURN(transaction);
    if (op_ret) {
        const message = op_ret.scriptPubKey?.asm.split("OP_RETURN ")[1];
        const openbook_data = parseOPRETURN(message);
        if (openbook_data) {
            const tx_details = await extractTransactionDetails(transaction, openbook_data);
            if (!tx_details) {
                return undefined;
            }
            const { seller, buyer, total_price, unit_price, service_fee_recipient, service_fee } = tx_details;

            const block = await rpc.getBlockFromHash(transaction.blockhash);
            if (seller && buyer && total_price !== undefined && unit_price !== undefined) {
                return {
                    txid: transaction.txid,
                    timestamp: transaction.time,
                    seller,
                    buyer,
                    ...openbook_data,
                    total_price,
                    unit_price,
                    block_hash: transaction.blockhash,
                    block_index: block.height,
                    service_fee_recipient,
                    service_fee,
                };
            }
        }
    }
    return undefined;
}

//Just for testing
export async function parseTxForAtomicSwap(txid: string): Promise<ParsedTransaction | undefined> {
    const transaction = await rpc.getTransaction(txid) as Transaction;

    if (!transaction) {
        logger.error(`Transaction not found: ${txid}`);
        return;
    }

    return parseTransactionForAtomicSwap(transaction);
}

//TODO: This was before using UTXO, just for reference
//async function parseTransactions(txs: string[]): Promise<{ transactions: Transaction[], atomic_swaps: ParsedTransaction[] }> {
//    const transactions = await rpc.getMultipleTransactions(txs as string[], true, 1000);
//    const atomic_swaps_transactions = await Promise.all(transactions.map((tx: Transaction) => {
//        const transaction = parseTransactionForAtomicSwap(tx);
//        return transaction;
//    }));
//    progress.finishProgress();
//    const atomic_swaps = atomic_swaps_transactions.filter(Boolean) as ParsedTransaction[];
//    return {
//        transactions,
//        atomic_swaps
//    };
//}


export async function parseXCPEvents(events: XCPUtxoMoveInfo[]): Promise<ParsedTransaction[]> {
    const atomic_swaps = await Promise.all(events.map(async (event) => {
        const transaction = await rpc.getTransaction(event.txid) as Transaction;
        const extractedTx = await extractTransactionDetails(transaction, { qty: event.qty });
        if (!extractedTx) {
            return undefined;
        }
        const { seller, buyer, total_price, unit_price, service_fee_recipient, service_fee } = extractedTx;
        if (seller && buyer && total_price && unit_price) {
            const result = {
                txid: event.txid as string,
                protocol: 0,
                assetId: event.assetId,
                qty: event.qty,
                seller,
                buyer,
                total_price,
                unit_price,
                timestamp: event.timestamp,
                service_fee_recipient: service_fee_recipient || null,
                service_fee: service_fee || null
            };
            return result;
        }
        return undefined;
    }));
    return atomic_swaps.filter(Boolean) as ParsedTransaction[];
}


export async function parseBlock(db: Database, blockInfo: Block): Promise<{ transactions: Transaction[], atomic_swaps: ParsedTransaction[] }> {
    //const { transactions, atomic_swaps } = await parseTransactions(blockInfo.tx as string[])
    const events = await getEventsByBlock(blockInfo.height);
    logger.info(`Found ${events.length} utxo move events for block ${blockInfo.height}`);
    const atomic_swaps = await parseXCPEvents(events);
    const filtered_atomic_swaps = atomic_swaps.map((swap: ParsedTransaction) => {
        return {
            ...swap,
            block_hash: blockInfo.hash,
            block_index: blockInfo.height
        }
    });

    executeAtomicOperations(db, (db) => {
        try {
            storeBlockData(db, {
                block_index: blockInfo.height,
                block_hash: blockInfo.hash,
                block_time: blockInfo.time,
                transactions: JSON.stringify(filtered_atomic_swaps.map((swap) => swap?.txid))
            });
            storeAtomicSwaps(db, filtered_atomic_swaps as ParsedTransaction[]);
        } catch (error) {
            logger.error("Error storing block data or atomic swaps:", error);
            throw error;
        }
    });
    return { transactions: [], atomic_swaps: filtered_atomic_swaps };
}