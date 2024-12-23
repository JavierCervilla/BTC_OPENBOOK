import type { PaginationOptions } from "@/services/database/utils/pagination.d.ts";
import type { Database } from "@db/sqlite";


export const DEFAULT_PAGINATION_LIMIT = 10;

export function buildPaginatedQuery(baseQuery: string, options: PaginationOptions): string {
    const { page, limit } = options;
    const offset = (page - 1) * limit;
    return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
}

export async function getTotalCount(db: Database, baseQuery: string): Promise<number> {
    // Remove ORDER BY, LIMIT, and OFFSET clauses
    const countQuery = baseQuery
        .replace(/ORDER BY[\s\S]*?(?=(LIMIT|OFFSET|$))/i, '')
        .replace(/LIMIT[\s\S]*?(?=(OFFSET|$))/i, '')
        .replace(/OFFSET[\s\S]*?$/i, '');

    // Replace the SELECT clause with COUNT(*)
    const selectIndex = countQuery.toUpperCase().indexOf('SELECT');
    const fromIndex = countQuery.toUpperCase().indexOf('FROM');
    if (selectIndex !== -1 && fromIndex !== -1) {
        const countQueryFinal = `SELECT COUNT(*) as count ${countQuery.substring(fromIndex)}`;

        const result = await db.prepare(countQueryFinal).get() as { count: number };
        if (!result || typeof result.count !== 'number') {
            throw new Error("Failed to retrieve count from database.");
        }
        return result.count;
    }
    throw new Error("Invalid base query provided.");
}