import * as xcp from "@/utils/xcp/rpc.ts";
import * as btc from "@/utils/btc/rpc.ts";
import { getUTXOSParams } from "@/services/counterparty/utxos.d.ts";
import { apiLogger } from "@/utils/logger.ts";
import { UTXOBalance } from "@/utils/xcp/rpc.d.ts";

function checkGetUTXOSParams(params: getUTXOSParams) {
    if (!params.address) {
        throw new Error("Address is required");
    }
}

function utxoBalanceAdapter(balances: UTXOBalance[]) {
    return balances.map((balance) => ({
        assetId: balance.asset,
        qty: Number(balance.quantity_normalized),
        protocol: 0,
        protocol_name: "COUNTERPARTY",
    }));
}

export async function getUtxos(params: getUTXOSParams) {
    try {
        checkGetUTXOSParams(params);
        const utxos = await btc.getUTXO(params.address);

        const chunkSize = 10; // Define el tamaño del chunk
        const utxoChunks = [];
        for (let i = 0; i < utxos.length; i += chunkSize) {
            utxoChunks.push(utxos.slice(i, i + chunkSize));
        }

        const utxosWithBalances = [];
        for (const chunk of utxoChunks) {
            const chunkBalances = await xcp.getUTXOSWithBalances(chunk.map((utxo) => `${utxo.txid}:${utxo.vout}`));
            for (const utxo of Object.keys(chunkBalances)) {
                const balance = chunkBalances[utxo];
                utxosWithBalances.push({
                    utxo,
                    balance
                });

                const utxoIndex = utxos.findIndex(u => `${u.txid}:${u.vout}` === utxo);
                if (utxoIndex !== -1) {
                    utxos[utxoIndex].balance = balance;
                    utxos[utxoIndex].utxo_balance = utxoBalanceAdapter(await xcp.getUTXOBalance(utxo));
                }
            }
        }
        return utxos;
    } catch (error) {
        apiLogger.error(error);
        throw error;
    }
}