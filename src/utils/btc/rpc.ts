import { CONFIG } from "@/config/index.ts";
import {apiLogger} from "../logger.ts";
import type { Transaction, rpcCall, Block } from './rpc.d.ts'
import * as progress from "../progress.ts";
import { address2ScriptHash } from "@/utils/btc/tx.ts";

export async function retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    fnName = "anonymous"
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: unknown) {
            apiLogger.warn(`retrying RPC call ${fnName}...`);
            if (i === retries - 1) {
                apiLogger.warn(`RPC call ${fnName} failed ${i + 1} times`);
                apiLogger.error(err);
                throw err;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    throw new Error(`RPC call ${fnName} failed after ${retries} retries`);
}

export async function callRPC(rpcCall: rpcCall, retries = 3) {
    return await retry(async () => {
        const response = await fetch(rpcCall.endpoint, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${btoa(`${rpcCall.rpcUser}:${rpcCall.rpcPassword}`)}`
            },
            body: JSON.stringify(rpcCall.call),
        },
        );
        const data = await response.json();
        return data;
    }, retries, rpcCall.call.method);
}

export async function asyncPool<T, R>(
    items: T[],
    limit: number,
    asyncFn: (item: T) => Promise<R>,
    retries = 3,
    fnName = "asyncFn"
): Promise<R[]> {
    const ret: Promise<R>[] = [];
    const executing: Promise<void>[] = [];

    const total = items.length;
    let completed = 0;
    progress.initProgress(total, 'Fetching transactions');
    for (const item of items) {
        const p = retry(() => asyncFn(item), retries, fnName);
        ret.push(p);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
        const e = p.then(() => {
            executing.splice(executing.indexOf(e), 1);
            completed++;
            progress.updateProgress(completed, total, 'Fetching transactions');
        });
        executing.push(e);
    }

    progress.finishProgress();
    return Promise.all(ret);
}

export async function getBlockHash(block_index: number) {
    const block = await callRPC({
        endpoint: CONFIG.BITCOIN.RPC_URL,
        rpcUser: CONFIG.BITCOIN.RPC_USER,
        rpcPassword: CONFIG.BITCOIN.RPC_PASSWORD,
        call: {
            jsonrpc: "2.0",
            id: 1,
            method: "getblockhash",
            params: [block_index]
        }
    });
    return block.result;
}

export async function getBlockFromHash(block_hash: string) {
    const block = await callRPC({
        endpoint: CONFIG.BITCOIN.RPC_URL,
        rpcUser: CONFIG.BITCOIN.RPC_USER,
        rpcPassword: CONFIG.BITCOIN.RPC_PASSWORD,
        call: {
            jsonrpc: "2.0",
            id: 1,
            method: "getblock",
            params: [block_hash]
        }
    });
    return block.result;
}

export async function getBlock(block_index: number): Promise<Block> {
    const block_hash = await getBlockHash(block_index);
    return await getBlockFromHash(block_hash);
}

export async function getBlockCount(): Promise<number> {
    const blockCount = await callRPC({
        endpoint: CONFIG.BITCOIN.RPC_URL,
        rpcUser: CONFIG.BITCOIN.RPC_USER,
        rpcPassword: CONFIG.BITCOIN.RPC_PASSWORD,
        call: {
            jsonrpc: "2.0",
            id: 1,
            method: "getblockcount",
            params: []
        }
    });
    return blockCount.result;
}

export async function getTransaction(txid: string, verbose = true): Promise<Transaction | string> {
    const transaction = await callRPC({
        endpoint: CONFIG.BITCOIN.RPC_URL,
        rpcUser: CONFIG.BITCOIN.RPC_USER,
        rpcPassword: CONFIG.BITCOIN.RPC_PASSWORD,
        call: {
            jsonrpc: "2.0",
            id: 1,
            method: "getrawtransaction",
            params: [txid, verbose]
        }
    });
    return transaction.result;
}

async function getUTXOFromMempoolSpace(address: string): Promise<UTXO[]> {
    const mempoolSpace = await fetch(`https://mempool.space/api/address/${address}/utxo`);
    const data = await mempoolSpace.json();
    return data;
}

export async function getUTXO(address: string): Promise<UTXO[]> {
    try {
        const params = {
            endpoint: CONFIG.ELECTRUM.RPC_URL as string,
            rpcUser: CONFIG.ELECTRUM.RPC_USER as string,
            rpcPassword: CONFIG.ELECTRUM.RPC_PASSWORD as string,
            call: {
                jsonrpc: "2.0",
                id: 1,
                method: "blockchain.scripthash.listunspent",
                params: [address2ScriptHash(address)]
            }
        }
        const data = await callRPC(params, 2);
        const sorted = data.result.sort((a: ElectrsUTXO, b: ElectrsUTXO) => b.value - a.value);
        const adapted = sorted.map((utxo: ElectrsUTXO) => ({
            txid: utxo.tx_hash,
            vout: utxo.tx_pos,
            status: {
                confirmed: utxo.height && utxo.height > 0,
                block_height: utxo.height
            },
            value: utxo.value,
            height: utxo.height
        }));
        return adapted;
    } catch (_error) {
        return await getUTXOFromMempoolSpace(address);
    }
}

export async function getMultipleTransactions(
    txids: string[],
    verbose = true,
    concurrency = 5
): Promise<(Transaction | string | null)[]> {
    progress.initProgress(txids.length, 'Fetching transactions');
    const result = await asyncPool<string, Transaction | string | null>(
        txids,
        concurrency,
        async (txid) => {
            const response = await fetch(CONFIG.BITCOIN.RPC_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${btoa(`${CONFIG.BITCOIN.RPC_USER}:${CONFIG.BITCOIN.RPC_PASSWORD}`)}`
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getrawtransaction",
                    params: [txid, verbose]
                }),
            },
            );
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${text}`);
            }

            const data = await response.json();
            const transaction = data.result;
            return transaction;
        },
        3,
        "getMultipleTransactions"
    );
    progress.finishProgress();
    return result;
}

export async function broadcastTransaction(tx: string) {
    const params = {
        endpoint: CONFIG.BITCOIN.RPC_URL as string,
        rpcUser: CONFIG.BITCOIN.RPC_USER as string,
        rpcPassword: CONFIG.BITCOIN.RPC_PASSWORD as string,
        call: {
            jsonrpc: "2.0",
            id: 1,
            method: "sendrawtransaction",
            params: [tx]
        }
    }
    const data = await callRPC(params, 2);
    return data;
}