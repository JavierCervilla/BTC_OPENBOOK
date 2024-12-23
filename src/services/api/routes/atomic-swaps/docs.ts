import type { Tspec } from 'tspec';

import type { controller } from "./routes.ts";

export type AtomicSwapsApiSpec = Tspec.DefineApiSpec<{
    tags: ["Atomic Swaps"];
    paths: {
        "/api/v1/atomic-swaps": {
            get: {
                tags: ["Atomic Swaps"];
                summary: "GET a paginated list of atomic swaps sorted by block",
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.getAtomicSwaps,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    txid: { type: 'string' },
                                    protocol: { type: 'number' },
                                    assetId: { type: 'string' },
                                    qty: { type: 'number' },
                                    seller: { type: 'string' },
                                    buyer: { type: 'string' },
                                    total_price: { type: 'number' },
                                    unit_price: { type: 'number' },
                                    timestamp: { type: 'string' },
                                    block_index: { type: 'number' },
                                    block_hash: { type: 'string' },
                                    service_fee_recipient: { type: 'string' },
                                    service_fee: { type: 'number' },
                                },
                            },
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalPages: { type: 'number' },
                    }
                }
            },
        },
        "/api/v1/atomic-swaps/tx/{txId}": {
            get: {
                tags: ["Atomic Swaps"];
                summary: "GET a paginated list of atomic swaps by tx id",
                path: {
                    txId: string,
                },
                handler: typeof controller.getAtomicSwapByTxId,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    txid: { type: 'string' },
                                    protocol: { type: 'number' },
                                    assetId: { type: 'string' },
                                    qty: { type: 'number' },
                                    seller: { type: 'string' },
                                    buyer: { type: 'string' },
                                    total_price: { type: 'number' },
                                    unit_price: { type: 'number' },
                                    timestamp: { type: 'string' },
                                    block_index: { type: 'number' },
                                    block_hash: { type: 'string' },
                                    service_fee_recipient: { type: 'string' },
                                    service_fee: { type: 'number' },
                                },
                            },
                        },
                        total: { type: 'number' },
                    }
                }
            },
        },
        "/api/v1/atomic-swaps/{asset}": {
            get: {
                tags: ["Atomic Swaps"];
                summary: "GET a paginated list of atomic swaps by asset",
                path: {
                    asset: string,
                },
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.getAtomicSwapByAsset,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    txid: { type: 'string' },
                                    protocol: { type: 'number' },
                                    assetId: { type: 'string' },
                                    qty: { type: 'number' },
                                    seller: { type: 'string' },
                                    buyer: { type: 'string' },
                                    total_price: { type: 'number' },
                                    unit_price: { type: 'number' },
                                    timestamp: { type: 'string' },
                                    block_index: { type: 'number' },
                                    block_hash: { type: 'string' },
                                    service_fee_recipient: { type: 'string' },
                                    service_fee: { type: 'number' },
                                },
                            },
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalPages: { type: 'number' },
                    }
                }
            },
        },
        "/api/v1/atomic-swaps/address/{address}": {
            get: {
                tags: ["Atomic Swaps"];
                summary: "GET a paginated list of atomic swaps where address is the seller, buyer, or service fee recipient",
                path: {
                    address: string,
                },
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.getAtomicSwapByAddress,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    txid: { type: 'string' },
                                    protocol: { type: 'number' },
                                    assetId: { type: 'string' },
                                    qty: { type: 'number' },
                                    seller: { type: 'string' },
                                    buyer: { type: 'string' },
                                    total_price: { type: 'number' },
                                    unit_price: { type: 'number' },
                                    timestamp: { type: 'string' },
                                    block_index: { type: 'number' },
                                    block_hash: { type: 'string' },
                                    service_fee_recipient: { type: 'string' },
                                    service_fee: { type: 'number' },
                                },
                            },
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalPages: { type: 'number' },
                    }
                }
            },
        },
        "/api/v1/atomic-swaps/addresses": {
            get: {
                tags: ["Atomic Swaps"];
                summary: "GET a paginated list of unique addresses that have participated in atomic swaps",
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.getUniqueAddresses,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalPages: { type: 'number' },
                    }
                }
            },
        },
        "/api/v1/atomic-swaps/addresses/{type}": {
            get: {
                tags: ["Atomic Swaps"];
                summary: "GET a paginated list of unique addresses that have participated in atomic swaps by type (seller, buyer)",
                path: {
                    type: string,
                },
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.getUniqueAddressesByType,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalPages: { type: 'number' },
                    }
                }
            },
        },
    }
}>;


