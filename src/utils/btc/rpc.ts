import { CONFIG } from "@/config/index.ts";
import logger from "../logger.ts";

export async function retry<T>(fn: () => Promise<T>, retries = 3, fnName = "anonymous"): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: unknown) {
            if (i === retries) {
                logger.warn(`RPC call ${fnName} failed ${i} times`);
                logger.error(err);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    return retry(fn, 0);
}

export async function callRPC(rpcCall: rpcCall) {
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
    }, 3, rpcCall.call.method);
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