const cache: Record<string, CacheEntry> = {};
const DEFAULT_CACHE_EXPIRATION_MS = 5 * 60 * 1000;

export function getFromCache(key: string): unknown | null {
    const entry = cache[key];
    if (entry && (Date.now() - entry.timestamp < entry.expiration)) {
        return entry.data;
    }
    return null;
}

export function setInCache({ key, data, expiration = DEFAULT_CACHE_EXPIRATION_MS }: { key: string, data: unknown, expiration?: number }): void {
    cache[key] = { data, timestamp: Date.now(), expiration };
}