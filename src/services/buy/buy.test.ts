import { createBuy } from "@/services/buy/buy.ts";

Deno.test("Should create a buy order", async () => {
    const buyOrder = await createBuy({
        id: "1c98219645f3bf8b845d290ff46eb1f62a7a908a289867507f03eeb2fd0b38a4",
        buyer: "bc1qm4lja9skums9v8vxj44atkkhlc7akdrfxlzgrc",
        serviceFee: [
            {
                address: "bc1qkjdkyq9sn3fzn480ltjynqmyauptvgryuvnv0z",
                amount: 10000n
            },
            {
                address: "bc1qkjdkyq9sn3fzn480ltjynqmyauptvgryuvnv0z",
                amount: 10000n
            }
        ],
        feeRate: 10
    })
    console.log(buyOrder);
})