import type { Tspec } from 'tspec';

import { orderSample, ordersListSample } from "./examples.ts";

import type { controller } from "./routes.ts";

export type OrdersApiSpec = Tspec.DefineApiSpec<{
    tags: ["Orders"];
    paths: {
        "/api/v1/orders": {
            get: {
                summary: "This method will return a paginated list of onchain orders",
                query: {
                    page?: number,
                    limit?: number,
                },
                handler: typeof controller.getOpenbookListings,
                responses: {
                    200: {
                        description: "Succesful response with a list of orders",
                        content: {
                            "application/json": {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        total: { type: 'number' },
                                        page: { type: 'number' },
                                        limit: { type: 'number' },
                                        totalPages: { type: 'number' },
                                        result: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    txId: { type: 'string', description: 'The txId of the order TX. This is the main identifier for the order.' },
                                                    timestamp: { type: 'number', description: 'The timestamp of the block containing the order.' },
                                                    block_index: { type: 'number', description: 'The index of the block containing the order.' },
                                                    utxo: { type: 'string', description: 'The utxo used for the order that contains the assets.' },
                                                    seller: { type: 'string', description: 'The seller address.' },
                                                    psbt: { type: 'string', description: 'The PSBT of the order that needs to be fulfilled for finishing the swap.' },
                                                    utxo_balance: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                assetId: { type: 'string', description: 'The assetId of the asset.' },
                                                                qty: { type: 'number', description: 'The quantity of the assetId attached to that utxo.' },
                                                                protocol: { type: 'number', description: 'The protocol of the asset, 0 for COUNTERPARTY' },
                                                                protocol_name: { type: 'string', description: 'The name of the protocol, COUNTERPARTY' },
                                                            }
                                                        }
                                                    },
                                                    status: { type: 'string', description: 'The status of the order' },
                                                }
                                            }
                                        },
                                    },
                                },
                                example: typeof ordersListSample
                            }
                        }
                    }
                }
            },
        },
        "/api/v1/orders/:txid": {
            get: {
                summary: "This method will return an onchain order by its txId",
                path: {
                    txId: string,
                },
                handler: typeof controller.getOpenbookListingsByTxId,
                responses: {
                    200: {
                        description: "Succesful response with an order",
                        content: {
                            "application/json": {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        txId: { type: 'string', description: 'The txId of the order TX. This is the main identifier for the order.' },
                                        timestamp: { type: 'number', description: 'The timestamp of the block containing the order.' },
                                        block_index: { type: 'number', description: 'The index of the block containing the order.' },
                                        utxo: { type: 'string', description: 'The utxo used for the order that contains the assets.' },
                                        seller: { type: 'string', description: 'The seller address.' },
                                        psbt: { type: 'string', description: 'The PSBT of the order that needs to be fulfilled for finishing the swap.' },
                                        utxo_balance: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    assetId: { type: 'string', description: 'The assetId of the asset.' },
                                                    qty: { type: 'number', description: 'The quantity of the assetId attached to that utxo.' },
                                                    protocol: { type: 'number', description: 'The protocol of the asset, 0 for COUNTERPARTY' },
                                                    protocol_name: { type: 'string', description: 'The name of the protocol, COUNTERPARTY' },
                                                }
                                            }
                                        },
                                        status: { type: 'string', description: 'The status of the order' },
                                    }
                                }
                            }
                        },
                        example: typeof orderSample
                    }
                }
            },
        },
        "/api/v1/orders/asset/:asset": {
            get: {
                summary: "This method will return a paginated list of onchain orders that contains an specific asset",
                path: {
                    asset: string,
                },
                query: {
                    page: number,
                    limit: number,
                }
                handler: typeof controller.getOpenbookListingsByAsset,
                responses: {
                    200: {
                        description: "Succesful response with a list of orders",
                        content: {
                            "application/json": {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        total: { type: 'number' },
                                        page: { type: 'number' },
                                        limit: { type: 'number' },
                                        totalPages: { type: 'number' },
                                        result: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    txId: { type: 'string', description: 'The txId of the order TX. This is the main identifier for the order.' },
                                                    timestamp: { type: 'number', description: 'The timestamp of the block containing the order.' },
                                                    block_index: { type: 'number', description: 'The index of the block containing the order.' },
                                                    utxo: { type: 'string', description: 'The utxo used for the order that contains the assets.' },
                                                    seller: { type: 'string', description: 'The seller address.' },
                                                    psbt: { type: 'string', description: 'The PSBT of the order that needs to be fulfilled for finishing the swap.' },
                                                    utxo_balance: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                assetId: { type: 'string', description: 'The assetId of the asset.' },
                                                                qty: { type: 'number', description: 'The quantity of the assetId attached to that utxo.' },
                                                                protocol: { type: 'number', description: 'The protocol of the asset, 0 for COUNTERPARTY' },
                                                                protocol_name: { type: 'string', description: 'The name of the protocol, COUNTERPARTY' },
                                                            }
                                                        }
                                                    },
                                                    status: { type: 'string', description: 'The status of the order' },
                                                }
                                            }
                                        }
                                    }
                                },
                                example: typeof ordersListSample
                            }
                        }
                    },
                },
            }
        }
        "/api/v1/orders/address/:address": {
            get: {
                summary: "This method will return a paginated list of onchain orders that are created by an specific seller address.",
                path: {
                    address: string,
                },
                query: {
                    page: number,
                    limit: number,
                }
                handler: typeof controller.getOpenbookListingsByAsset,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                page: { type: 'number' },
                                limit: { type: 'number' },
                                totalPages: { type: 'number' },
                                result: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            txId: { type: 'string', description: 'The txId of the order TX. This is the main identifier for the order.' },
                                            timestamp: { type: 'number', description: 'The timestamp of the block containing the order.' },
                                            block_index: { type: 'number', description: 'The index of the block containing the order.' },
                                            utxo: { type: 'string', description: 'The utxo used for the order that contains the assets.' },
                                            seller: { type: 'string', description: 'The seller address.' },
                                            psbt: { type: 'string', description: 'The PSBT of the order that needs to be fulfilled for finishing the swap.' },
                                            utxo_balance: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        assetId: { type: 'string', description: 'The assetId of the asset.' },
                                                        qty: { type: 'number', description: 'The quantity of the assetId attached to that utxo.' },
                                                        protocol: { type: 'number', description: 'The protocol of the asset, 0 for COUNTERPARTY' },
                                                        protocol_name: { type: 'string', description: 'The name of the protocol, COUNTERPARTY' },
                                                    }
                                                }
                                            },
                                            status: { type: 'string', description: 'The status of the order' },
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        },
        "/api/v1/orders/list/sign": {
            post: {
                summary: "This is the first step for create a lsting order, this will return a PSBT for signing the order, this method has not any cost for the user.",
                body: {
                    utxo: string,
                    seller: string,
                    price: number,
                    feeRate: number,
                },
                handler: typeof controller.createOrderPsbt,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                psbt: { type: 'string', description: 'The listing PSBT for signing.' },
                                utxo: { type: 'string', description: 'The utxo used for the listing.' },
                                seller: { type: 'string', description: 'The seller address.' },
                                price: { type: 'number', description: 'The price of the listing.' },
                            }
                        }
                    }
                }
            },
        },
        "/api/v1/orders/list/submit": {
            post: {
                summary: "This is the second step for create a lsting order, this will rquire a PSBT signed for the order using the previous step (/api/v1/orders/list/sign), this method will return a full signed tx with the listing info attached, this method will incur a miners fee for the listing.",
                body: {
                    psbt: string,
                    utxo: string,
                    seller: string,
                    price: number,
                    feeRate: number,
                },
                handler: typeof controller.createListingTx,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                psbt: { type: 'string', description: 'The listing PSBT for signing.' },
                                btc_in: { type: 'number', description: 'The btc that the user will be using for the listing.' },
                                btc_out: { type: 'number', description: 'The btc that the user will spend from the listing + the bitcoin will receive.' },
                                change: { type: 'number', description: 'The btc that the user will receive from the listing.' },
                                vsize: { type: 'number', description: 'The vsize of the listing.' },
                                fee: { type: 'number', description: 'The miners fee used for the listing.' },
                            }
                        }
                    }
                }
            },
        },
        "/api/v1/orders/buy": {
            post: {
                summary: "this method will create and return a buy transaction for an order",
                body: {
                    buyer: { type: 'string', description: 'The buyer address.' },
                    id: { type: 'string', description: 'The txid of the order to buy.' },
                    feeRate: { type: 'number', description: 'The fee rate for the buy transaction.' },
                    serviceFee: { type: 'array', description: 'The service fee for the buy transaction.' },
                },
                handler: typeof controller.buyOrder,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                psbt: { type: 'string', description: 'The buy transaction.' },
                                inputsToSign: {
                                    type: 'array',
                                    description: 'The inputs to sign for the buy transaction.'
                                    items: {
                                        type: 'object',
                                        properties: {
                                            index: { type: 'number', description: 'The index of the imput to sign.' },
                                            sighashType: { type: 'array', items: { type: 'number' }, description: 'The sighash type of the input.' },
                                        }
                                    }
                                },
                                fee: { type: 'number', description: 'The miners fee for the buy transaction.' },
                                btc_in: { type: 'number', description: 'The btc that the user will be using for the buy.' },
                                btc_out: { type: 'number', description: 'The btc that the user will spend from the buy + the bitcoin will receive.' },
                                change: { type: 'number', description: 'The btc that the user will receive from the buy.' },
                                expectedFee: { type: 'number', description: 'The expected fee for the buy transaction.' },
                                baseSize: { type: 'number', description: 'The base size of the buy.' },
                                vsize: { type: 'number', description: 'The vsize of the buy.' },
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/orders/cancel": {
            post: {
                summary: "this method will cancel an order by spending the utxo of the order and sending it to the seller address, this method will incur a miners fee for the cancel.",
                body: {
                    id: string,
                    feeRate: number,
                },
                handler: typeof controller.cancelOrder,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                psbt: { type: 'string', description: 'The cancel transaction.' },
                                inputsToSign: {
                                    type: 'array',
                                    description: 'The inputs to sign for the cancel transaction.'
                                    items: {
                                        type: 'object',
                                        properties: {
                                            index: { type: 'number', description: 'The index of the imput to sign.' },
                                            sighashType: { type: 'array', items: { type: 'number' }, description: 'The sighash type of the input.' },
                                        }
                                    }
                                },
                                fee: { type: 'number', description: 'The miners fee for the cancel transaction.' },
                                btc_in: { type: 'number', description: 'The btc that the user will be using for the cancel.' },
                                btc_out: { type: 'number', description: 'The btc that the user will spend from the cancel + the bitcoin will receive.' },
                                change: { type: 'number', description: 'The btc that the user will receive from the cancel.' },
                                expectedFee: { type: 'number', description: 'The expected fee for the cancel transaction.' },
                                vsize: { type: 'number', description: 'The vsize of the cancel.' },
                                baseSize: { type: 'number', description: 'The base size of the cancel.' },
                            }
                        }
                    }
                }
            }
        }
    }
}>;


