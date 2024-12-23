import type { Tspec } from 'tspec';

import type { controller } from "./routes.ts";

export type BlocksApiSpec = Tspec.DefineApiSpec<{
    tags: ["Blocks"];
    paths: {
        "/api/v1/blocks": {
            get: {
                tags: ["Blocks"];
                summary: `GET a paginated list of blocks with a summary of the event counts happening in this block and an array of important transactions (atomic swaps or order listings)`,
                query: {
                    page: number,
                    limit: number,
                },
                handler: typeof controller.getBlocks,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    block_index: { type: 'number' },
                                    events: {
                                        type: 'object',
                                        description: 'The number of events happening in this block',
                                        properties: {
                                            NEW_BLOCK: { type: "number" },
                                            NEW_TRANSACTION: { type: "number" },
                                            NEW_TRANSACTION_OUTPUT: { type: "number" },
                                            BLOCK_PARSED: { type: "number" },
                                            TRANSACTION_PARSED: { type: "number" },
                                            DEBIT: { type: "number" },
                                            CREDIT: { type: "number" },
                                            ENHANCED_SEND: { type: "number" },
                                            MPMA_SEND: { type: "number" },
                                            SEND: { type: "number" },
                                            ASSET_TRANSFER: { type: "number" },
                                            SWEEP: { type: "number" },
                                            ASSET_DIVIDEND: { type: "number" },
                                            RESET_ISSUANCE: { type: "number" },
                                            ASSET_CREATION: { type: "number" },
                                            ASSET_ISSUANCE: { type: "number" },
                                            ASSET_DESTRUCTION: { type: "number" },
                                            OPEN_ORDER: { type: "number" },
                                            ORDER_MATCH: { type: "number" },
                                            ORDER_UPDATE: { type: "number" },
                                            ORDER_FILLED: { type: "number" },
                                            ORDER_MATCH_UPDATE: { type: "number" },
                                            BTC_PAY: { type: "number" },
                                            CANCEL_ORDER: { type: "number" },
                                            ORDER_EXPIRATION: { type: "number" },
                                            ORDER_MATCH_EXPIRATION: { type: "number" },
                                            OPEN_DISPENSER: { type: "number" },
                                            DISPENSER_UPDATE: { type: "number" },
                                            REFILL_DISPENSER: { type: "number" },
                                            DISPENSE: { type: "number" },
                                            BROADCAST: { type: "number" },
                                            NEW_FAIRMINTER: { type: "number" },
                                            FAIRMINTER_UPDATE: { type: "number" },
                                            NEW_FAIRMINT: { type: "number" },
                                            ATTACH_TO_UTXO: { type: "number" },
                                            DETACH_FROM_UTXO: { type: "number" },
                                            UTXO_MOVE: { type: "number" },
                                            BURN: { type: "number" },
                                            BET_EXPIRATION: { type: "number" },
                                            BET_MATCH: { type: "number" },
                                            BET_MATCH_EXPIRATION: { type: "number" },
                                            BET_MATCH_RESOLUTON: { type: "number" },
                                            BET_MATCH_UPDATE: { type: "number" },
                                            BET_UPDATE: { type: "number" },
                                            CANCEL_BET: { type: "number" },
                                            INCREMENT_TRANSACTION_COUNT: { type: "number" },
                                            INVALID_CANCEL: { type: "number" },
                                            NEW_ADDRESS_OPTIONS: { type: "number" },
                                            OPEN_BET: { type: "number" },
                                            OPEN_RPS: { type: "number" },
                                            RPS_EXPIRATION: { type: "number" },
                                            RPS_MATCH: { type: "number" },
                                            RPS_MATCH_EXPIRATION: { type: "number" },
                                            RPS_MATCH_UPDATE: { type: "number" },
                                            RPS_RESOLVE: { type: "number" },
                                            RPS_UPDATE: { type: "number" }
                                        }
                                    },
                                    block_time: { type: 'string', description: 'The timestamp of the block' },
                                    transactions: { type: 'array', description: 'The relevant transactions happening in this block (atomic swaps or order listings/cancelling)' },
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
        "/api/v1/blocks/summary": {
            get: {
                tags: ["Blocks"];
                summary: `GET a list of blocks grouped by day with the sum of events happening in each block of this day`,
                handler: typeof controller.getBlocksGroupedByDayWithEventSums,
                "x-disable-try-it-out": true,
                responses: {
                    200: {
                        result: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    block_index: { type: 'number' },
                                    events: {
                                        type: 'object',
                                        description: 'The number of events happening in this block',
                                        properties: {
                                            NEW_BLOCK: { type: "number" },
                                            NEW_TRANSACTION: { type: "number" },
                                            NEW_TRANSACTION_OUTPUT: { type: "number" },
                                            BLOCK_PARSED: { type: "number" },
                                            TRANSACTION_PARSED: { type: "number" },
                                            DEBIT: { type: "number" },
                                            CREDIT: { type: "number" },
                                            ENHANCED_SEND: { type: "number" },
                                            MPMA_SEND: { type: "number" },
                                            SEND: { type: "number" },
                                            ASSET_TRANSFER: { type: "number" },
                                            SWEEP: { type: "number" },
                                            ASSET_DIVIDEND: { type: "number" },
                                            RESET_ISSUANCE: { type: "number" },
                                            ASSET_CREATION: { type: "number" },
                                            ASSET_ISSUANCE: { type: "number" },
                                            ASSET_DESTRUCTION: { type: "number" },
                                            OPEN_ORDER: { type: "number" },
                                            ORDER_MATCH: { type: "number" },
                                            ORDER_UPDATE: { type: "number" },
                                            ORDER_FILLED: { type: "number" },
                                            ORDER_MATCH_UPDATE: { type: "number" },
                                            BTC_PAY: { type: "number" },
                                            CANCEL_ORDER: { type: "number" },
                                            ORDER_EXPIRATION: { type: "number" },
                                            ORDER_MATCH_EXPIRATION: { type: "number" },
                                            OPEN_DISPENSER: { type: "number" },
                                            DISPENSER_UPDATE: { type: "number" },
                                            REFILL_DISPENSER: { type: "number" },
                                            DISPENSE: { type: "number" },
                                            BROADCAST: { type: "number" },
                                            NEW_FAIRMINTER: { type: "number" },
                                            FAIRMINTER_UPDATE: { type: "number" },
                                            NEW_FAIRMINT: { type: "number" },
                                            ATTACH_TO_UTXO: { type: "number" },
                                            DETACH_FROM_UTXO: { type: "number" },
                                            UTXO_MOVE: { type: "number" },
                                            BURN: { type: "number" },
                                            BET_EXPIRATION: { type: "number" },
                                            BET_MATCH: { type: "number" },
                                            BET_MATCH_EXPIRATION: { type: "number" },
                                            BET_MATCH_RESOLUTON: { type: "number" },
                                            BET_MATCH_UPDATE: { type: "number" },
                                            BET_UPDATE: { type: "number" },
                                            CANCEL_BET: { type: "number" },
                                            INCREMENT_TRANSACTION_COUNT: { type: "number" },
                                            INVALID_CANCEL: { type: "number" },
                                            NEW_ADDRESS_OPTIONS: { type: "number" },
                                            OPEN_BET: { type: "number" },
                                            OPEN_RPS: { type: "number" },
                                            RPS_EXPIRATION: { type: "number" },
                                            RPS_MATCH: { type: "number" },
                                            RPS_MATCH_EXPIRATION: { type: "number" },
                                            RPS_MATCH_UPDATE: { type: "number" },
                                            RPS_RESOLVE: { type: "number" },
                                            RPS_UPDATE: { type: "number" }
                                        }
                                    },
                                    block_time: { type: 'string', description: 'The timestamp of the block' },
                                    transactions: { type: 'array', description: 'The relevant transactions happening in this block (atomic swaps or order listings/cancelling)' },
                                },
                            },
                        },
                        total: { type: 'number' },
                    }
                }
            },
        },
    }
}>;


