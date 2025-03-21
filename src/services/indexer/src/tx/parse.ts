import * as bitcoin from "bitcoinjs-lib";

import logger from "@/utils/logger.ts";
import * as rpc from "@/utils/btc/rpc.ts";
import { OpenBook } from "@/services/openbook/openbook.ts";
import type { Transaction, VOUT } from "@/utils/btc/rpc.d.ts"
import type { OpenBookListing, ParsedTransaction } from "@/services/indexer/src/tx/parse.d.ts";
import { executeAtomicOperations, storeAtomicSwaps, storeBlockData, storeOpenbookListings } from "@/services/indexer/src/db/methods.ts";
import type { Database } from "@db/sqlite";
import type { UTXOBalance, XCPUtxoMoveInfo } from "@/utils/xcp/rpc.d.ts";
import * as xcp from "@/utils/xcp/rpc.ts";
import * as tx from "@/services/ordersbook/tx.ts";
import * as hex from "@/utils/index.ts";
import { CONFIG } from "@/config/index.ts";

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
    openbook_data: { qty: bigint },
    event: XCPUtxoMoveInfo
): Promise<{
    seller?: string,
    buyer?: string,
    total_price?: bigint,
    unit_price?: bigint,
    service_fees?: { address: string, fee: bigint }[]
} | undefined> {
    let seller: string | undefined;
    let buyer: string | undefined;
    let total_price: bigint | undefined;
    let unit_price: bigint | undefined;
    const service_fees: { address: string, fee: bigint }[] = [];

    const vinAddresses = await getVinAddresses(transaction, (address, isSeller) => {
        if (isSeller) {
            seller = address;
        } else {
            buyer = address;
        }
    }, event);

    const voutAddresses = new Set<string>();
    for (const vout of transaction.vout) {
        const address = getAddressFromVout(vout);
        if (address) {
            voutAddresses.add(address);
            if (address === seller) {
                total_price = BigInt(Math.round(vout.value * 1e8));
                unit_price = calculateUnitPrice(total_price, openbook_data.qty);
            }
            if (address !== buyer && address !== seller) {
                service_fees.push({ address, fee: BigInt(Math.round(vout.value * 1e8)) });
            }
        }
    }

    if (isValidTransaction(seller, buyer, vinAddresses, voutAddresses)) {
        return { seller, buyer, total_price, unit_price, service_fees };
    }
    return undefined;
}

async function getVinAddresses(
    transaction: Transaction,
    assignRoles: (address: string, isDust: boolean) => void,
    event: XCPUtxoMoveInfo
): Promise<Set<string>> {
    const vinAddresses = new Set<string>();
    for (const vin of transaction.vin) {
        const tx = await rpc.getTransaction(vin.txid) as Transaction;
        const vout = tx.vout.find((vout: VOUT) => vout.n === vin.vout);
        if (vout) {
            const address = getAddressFromVout(vout);
            if (address) {
                vinAddresses.add(address);
                assignRoles(address, `${vin.txid}:${vin.vout}` === event.source);
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


export async function parseTransactionForAtomicSwap(transaction: Transaction, event: XCPUtxoMoveInfo) {
    const op_ret = hasOPRETURN(transaction);
    if (op_ret) {
        const message = op_ret.scriptPubKey?.asm.split("OP_RETURN ")[1];
        const openbook_data = parseOPRETURN(message);
        if (openbook_data) {
            const tx_details = await extractTransactionDetails(transaction, openbook_data, event);
            if (!tx_details) {
                return undefined;
            }
            const { seller, buyer, total_price, unit_price, service_fees } = tx_details;

            const block = await rpc.getBlockFromHash(transaction.blockhash);
            if (seller && buyer && total_price !== undefined && unit_price !== undefined) {
                
                return {
                    txid: transaction.txid,
                    timestamp: new Date(transaction.time * 1000).toISOString(),
                    seller,
                    buyer,
                    total_price,
                    unit_price,
                    block_hash: transaction.blockhash,
                    block_index: block.height,
                    service_fees: service_fees ?? []
                };
            }
        }
    }
    return undefined;
}

//Just for testing
export async function parseTxForAtomicSwap(txid: string) {
    const transaction = await rpc.getTransaction(txid) as Transaction;
    const event = await xcp.getSpecificEventsByTXID(transaction.txid);

    if (!transaction) {
        logger.error(`Transaction not found: ${txid}`);
        return;
    }

    return parseTransactionForAtomicSwap(transaction, event);
}


export async function parseXCPEvents(events: XCPUtxoMoveInfo[]): Promise<ParsedTransaction[]> {
    const atomic_swaps = await Promise.all(events.map(async (event) => {
        const transaction = await rpc.getTransaction(event.txid) as Transaction;
        const extractedTx = await extractTransactionDetails(transaction, { qty: event.qty }, event);
        if (!extractedTx) {
            return undefined;
        }

        const { seller, buyer, total_price, unit_price, service_fees } = extractedTx;
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
                utxo: event.source,
                timestamp: new Date(event.timestamp * 1000).toISOString(),
                service_fees
            };
            return result;
        }
        return undefined;
    }));
    const agrupped_atomic_swaps = atomic_swaps.filter(Boolean).reduce<Record<string, ParsedTransaction>>((acc, swap) => {
        if (!swap) {
            return acc;
        }
        if (!acc[swap.txid]) {
            acc[swap.txid] = {
                txid: swap.txid,
                protocol: swap.protocol,
                seller: swap.seller,
                buyer: swap.buyer,
                total_price: swap.total_price,
                unit_price: swap.unit_price,
                timestamp: swap.timestamp,
                utxo: swap.utxo,
                utxo_balance: [
                    {
                        assetId: swap?.assetId as string,
                        qty: swap?.qty as bigint,
                        protocol: swap?.protocol,
                        protocol_name: "COUNTERPARTY"
                    }
                ],
                service_fees: swap.service_fees ?? []
            };
        } else {
            acc[swap.txid].utxo_balance.push({
                assetId: swap?.assetId as string,
                qty: swap?.qty as bigint,
                protocol: swap?.protocol as number,
                protocol_name: "COUNTERPARTY"
            });
        }
        return acc;
    }, {});
    return Object.values(agrupped_atomic_swaps);
}

function getLockTimeFromTXHex(tx_hex: string) {
    const bytes = hex.hex2bin(tx_hex.slice(-8));
    const lockTime = (
        (bytes[3] << 24) |
        (bytes[2] << 16) |
        (bytes[1] << 8) |
        bytes[0]
    ) >>> 0;
    return lockTime;
}

export function hasOpReturnOutputs(txHex: string): boolean {
    const tx = bitcoin.Transaction.fromHex(txHex);
    return tx.outs.some((output) => output.script[0] === bitcoin.opcodes.OP_RETURN);
}


export async function parseBlock(db: Database, blockInfo: Block): Promise<{ transactions: Transaction[], atomic_swaps: ParsedTransaction[], openbook_listings: OpenBookListing[] }> {
    let filtered_atomic_swaps: ParsedTransaction[] = [];
    const events = await xcp.getEventsCountByBlock(blockInfo.height);
    if (
        blockInfo.height >= CONFIG.INDEXER.START_UTXO_MOVE_BLOCK &&
        events.UTXO_MOVE > 0
    ) {

        const utxo_move_events = await xcp.getSpecificEventsByBlock(blockInfo.height);
        const atomic_swaps = await parseXCPEvents(utxo_move_events);
        
        filtered_atomic_swaps =  atomic_swaps.map((swap: ParsedTransaction) => {
            return {
                ...swap,
                block_hash: blockInfo.hash,
                block_index: blockInfo.height
            }
        });
    }

    const transactions = filtered_atomic_swaps.map((swap) => swap?.txid);

    let txs: Transaction[] = [];
    let valid_openbook_listings: OpenBookListing[] = [];
    if (blockInfo.height >= CONFIG.INDEXER.START_OPENBOOK_LISTINGS_BLOCK) {
        txs = await rpc.getMultipleTransactions(blockInfo.tx as string[], false, 1000);
        const potential_openbook_listings = txs.filter((tx) => getLockTimeFromTXHex(tx.hex) === CONFIG.OPENBOOK.TIMELOCK && hasOpReturnOutputs(tx.hex))
        const openbook_listings = await Promise.all(potential_openbook_listings.map(async (tx) => await parseOpenbookListingTx(tx)));
        valid_openbook_listings = openbook_listings.filter(tx => tx !== undefined).map(tx => ({ ...tx, timestamp: blockInfo.time, block_index: blockInfo.height }));
        transactions.push(...valid_openbook_listings.map(tx => tx.txid));
    }

    executeAtomicOperations(db, (db) => {
        try {
            storeBlockData(db, {
                block_index: blockInfo.height,
                block_time: new Date(blockInfo.time * 1000).toISOString(),
                transactions: JSON.stringify(transactions),
                events: JSON.stringify(events),
                nTxs: blockInfo.tx.length
            });
            storeAtomicSwaps(db, filtered_atomic_swaps as ParsedTransaction[]);
            storeOpenbookListings(db, valid_openbook_listings as OpenBookListing[]);
        } catch (error) {
            logger.error("Error storing block data or atomic swaps:", error);
            throw error;
        }
    });
    return { transactions: [], atomic_swaps: filtered_atomic_swaps, openbook_listings: valid_openbook_listings };
}


export async function parseOpenbookListingTx(transaction: { txid: string, hex: string }) {
    try {
        const tx_hex = await rpc.getTransaction(transaction.txid, false);
        const decoded = await tx.decodeListingTx(tx_hex);
        if (decoded) {
            const { utxo, price, seller, psbt } = decoded;
            const [tx_id, _vout] = utxo.split(":");
            const utxo_balance = await xcp.getUTXOBalanceFromUTXMoveEvent(tx_id);
            const result = {
                txid: transaction.txid,
                utxo,
                price,
                seller,
                psbt,
                utxo_balance: JSON.stringify(utxo_balance)
            }
            return result;
        }
        return undefined;
    } catch (error) {
        logger.error(`Error parsing openbook listing tx ${transaction.txid}: ${error}`);
        return undefined;
    }
}
