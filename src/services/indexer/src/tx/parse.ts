import * as rpc from "@/utils/btc/rpc.ts";
import logger from "@/utils/logger.ts";
import { OpenBook } from "@/services/openbook/openbook.ts";
import type { Transaction, VOUT } from "@/utils/btc/rpc.d.ts"

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
    } catch (_e) {
        // ignore
    }
}


type ParsedTransaction = {
    txid: string,
    protocol: number,
    assetId: string,
    qty: bigint,
    seller: string,
    buyer: string,
    total_price: bigint,
    unit_price: bigint,
    timestamp: number,
    block_index: number,
    block_hash: string,
}

export async function parseTxForAtomicSwap(txid: string): Promise<ParsedTransaction | undefined> {
    const transaction = await rpc.getTransaction(txid) as Transaction;

    if (!transaction) {
        logger.error(`Transaction not found: ${txid}`);
        return;
    }
    const op_ret = hasOPRETURN(transaction);
    if (op_ret) {
        let seller: string | undefined;
        let buyer: string | undefined;
        let total_price: bigint | undefined;
        let unit_price: bigint | undefined;
        const message = op_ret.scriptPubKey?.asm.split("OP_RETURN ")[1];

        const openbook_data = parseOPRETURN(message);
        if (openbook_data) {
            for (const vin of transaction.vin) {
                const tx = await rpc.getTransaction(vin.txid) as Transaction;
                const vout = tx.vout.find((vout: VOUT) => vout.n === vin.vout);
                if (vout && vout.value * 1e8 === 546) {
                    seller = vout.scriptPubKey?.address;
                } else if (vout) {
                    buyer = vout.scriptPubKey?.address;
                }
            }

            for (const vout of transaction.vout) {
                if (vout.scriptPubKey?.address === seller) {
                    total_price = BigInt(vout.value * 1e8);
                    unit_price = total_price / openbook_data.qty;
                }
            }

            const block = await rpc.getBlockFromHash(transaction.blockhash);
            if (seller && buyer && total_price !== undefined && unit_price !== undefined) {
                return {
                    txid,
                    timestamp: transaction.time,
                    seller,
                    buyer,
                    ...openbook_data,
                    total_price,
                    unit_price,
                    block_hash: transaction.blockhash,
                    block_index: block.height
                };
            }
        }
    }

    return undefined;
}