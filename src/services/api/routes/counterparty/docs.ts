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
    }
}>;


