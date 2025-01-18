export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface PaginatedResult<T> {
    result: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}