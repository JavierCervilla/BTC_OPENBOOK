import * as rpc from "@/utils/btc/rpc.ts";
import * as progress from "@/utils/progress.ts";

const block = 874100;
const bock_info = await rpc.getBlock(block);

const txs = bock_info.tx;


//progress.initProgress(txs.length);
//Deno.bench({
//    name: "Benchmark getMultipleTransaction with getMultipleTransactions",
//    fn: async () => {
//        await rpc.getMultipleTransactions(txs as string[], true, txs.length);
//    },
//});
//progress.finishProgress();

Deno.bench({
    name: "Benchmark getMultipleTransaction with promise.all",
    fn: async () => {
        progress.initProgress(txs.length);
        let completed = 0;
        await Promise.all(txs.map(async (tx: string) => {
            await rpc.getTransaction(tx);
            completed++;
            progress.updateProgress(completed, txs.length);
        }));
        completed = 0;
        progress.finishProgress();
    },
});
