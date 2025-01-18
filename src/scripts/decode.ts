import * as btc from "@/utils/btc/rpc.ts"
import * as tx from "@/services/ordersbook/tx.ts";

const txid = "1c98219645f3bf8b845d290ff46eb1f62a7a908a289867507f03eeb2fd0b38a4";

async function main() {
    const tx_hex = await btc.getTransaction(txid, false);
    
    const { psbt, utxo, seller, price } = await tx.decodeListingTx(tx_hex)
    console.log({ psbt, utxo, seller, price });
}

main();