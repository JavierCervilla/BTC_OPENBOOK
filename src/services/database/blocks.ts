import { Database } from "@db/sqlite";
import { CONFIG } from "@/config/index.ts";
import * as paginate from "@/services/database/utils/pagination.ts";

import type { Block, BlockSummary, EventCounts } from "@/services/database/blocks.d.ts";
import type { PaginatedResult, PaginationOptions } from "@/services/database/utils/pagination.d.ts";
import * as cache from "@/services/database/utils/cache.ts";


export async function getBlocks(options: PaginationOptions = { page: 1, limit: 10 }): Promise<PaginatedResult<Block>> {
    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });
    const query = paginate.buildPaginatedQuery(`
        SELECT 
            *, 
            json(events) as events, 
            json(transactions) as transactions 
        FROM blocks 
        ORDER BY block_index ASC
    `,
        options,
    );
    const blocks = await db.prepare(query).all() as Block[];
    const total = await paginate.getTotalCount(db, query);
    db.close();
    return {
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
        total: total,
        result: blocks,
    };
}

export async function getBlocksGroupedByDayWithEventSums(): Promise<{ result: BlockSummary[], total: number }> {
    const cacheKey = "blocks_grouped_by_day_with_event_sums";
    const cachedResult = cache.getFromCache(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    const db = new Database(CONFIG.DATABASE.DB_NAME, {
        readonly: true,
    });

    const baseQuery = `
        SELECT 
            DATE(block_time) as date, 
            nTxs,
            events
        FROM blocks 
        ORDER BY DATE(block_time) ASC
    `;
    const blocks = await db.prepare(baseQuery).all();
    db.close();

    const groupedBlocks: Record<string, EventCounts> = {};

    for (const block of blocks) {
        const { date, nTxs } = block;
        const events = JSON.parse(block.events);

        if (!groupedBlocks[date]) {
            groupedBlocks[date] = {
                BITCOIN: 0
            };
        }
        groupedBlocks[date]["BITCOIN"] += nTxs as number;
        for (const [event, count] of Object.entries(events)) {
            if (!groupedBlocks[date][event]) {
                groupedBlocks[date][event] = 0;
            }
            groupedBlocks[date][event] += count as number;
        }
    }

    const result: BlockSummary[] = Object.entries(groupedBlocks).map(([date, eventSums]) => ({
        date,
        events: eventSums,
    }));

    cache.setInCache({ key: cacheKey, data: result, expiration: 60 * 10 * 1000 }); // 1 hour

    return {
        result: result,
        total: result.length,
    };
}