import type { Tspec } from 'tspec';

import type { controller } from "./routes.ts";

export type XCPApiSpec = Tspec.DefineApiSpec<{
    tags: ["Counterparty"];
    paths: {
        "/api/v1/xcp/attach": {
            post: {
                summary: `POST a request to attach a counterparty asset to an UTXO using Counterparty`,
                body: {
                    asset: string,
                    address: string,
                    feeRate: number,
                },
                handler: typeof controller.attach,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                psbt: { type: 'string', description: 'The attaching PSBT for signing.' },
                                btc_in: { type: 'number', description: 'The BTC input for the attaching.' },
                                btc_out: { type: 'number', description: 'The BTC output for the attaching.' },
                                fee: { type: 'number', description: 'The miners fee for the attaching.' },
                            }
                        }
                    }
                },
            },
        },
        "/api/v1/xcp/detach": {
            post: {
                summary: `POST a request to detach a counterparty asset from an UTXO using Counterparty`,
                body: {
                    utxo: string,
                    address: string,
                    feeRate: number,
                },
                handler: typeof controller.detach,
                responses: {
                    200: {
                        result: {
                            type: 'object',
                            properties: {
                                psbt: { type: 'string', description: 'The detaching PSBT for signing.' },
                                btc_in: { type: 'number', description: 'The BTC input for the detaching.' },
                                btc_out: { type: 'number', description: 'The BTC output for the detaching.' },
                                fee: { type: 'number', description: 'The miners fee for the detaching.' },
                            }
                        }
                    }
                }
            },
        },
        "/api/v1/xcp/utxos/:address": {
            get: {
                summary: "GET UTXOs for a given address including UTXOS with balances",
                params: {
                    address: string,
                }
                handler: typeof controller.getUTXOS,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            properties: {
                                txid: { type: 'string' },
                                vout: { type: 'number' },
                                status: {
                                    confirmed: { type: 'boolean' },
                                    block_height: { type: 'number' }
                                },
                                value: { type: 'number' },
                                height: { type: 'number' },
                                balance: { type: 'boolean' },
                                utxo_balance: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            asset: { type: 'string' },
                                            asset_longname: { type: 'string' },
                                            quantity: { type: 'number' },
                                            utxo: { type: 'string' },
                                            utxo_address: { type: 'string' },
                                            asset_info: { type: 'object' },
                                            quantity_normalized: { type: 'string' }
                                        }
                                    }
                                }
                            },
                        },
                    }
                }
            }
        },
    }
}>;


