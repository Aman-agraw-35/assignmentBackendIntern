import Redis from 'ioredis';
import { config } from '../config/env';

class CacheService {
    private redis: Redis;

    constructor() {
        this.redis = new Redis(config.redisUrl, {
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        this.redis.on('error', (err) => {
            console.warn('Redis connection issue:', err.message);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl = config.cacheTtl): Promise<void> {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    }


    async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl = config.cacheTtl): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached) return cached;

        const fresh = await fetcher();
        await this.set(key, fresh, ttl);
        return fresh;
    }
}

export const cache = new CacheService();
