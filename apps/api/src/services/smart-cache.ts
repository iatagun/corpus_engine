import Redis from 'ioredis';
import crypto from 'crypto';
import fs from 'fs';
import { CorpusQuery } from '@corpus/types';

//

export class SmartQueryCache {
    private redis: Redis;
    private readonly TTL_LOW_COST = 300; // 5 mins
    private readonly TTL_HIGH_COST = 3600; // 1 hour

    private inflight: Map<string, Promise<any>>;

    constructor() {
        this.inflight = new Map();
        // Fallback to in-memory mock if Redis is not available?
        // For now, we assume Redis is available or we handle connection errors.
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            maxRetriesPerRequest: 1
        });

        this.redis.on('error', (err) => {
            console.error('Redis Error:', err);
            //
        });
    }

    public async get(query: CorpusQuery): Promise<any | null> {
        const key = this.generateKey(query);
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null; // Fail safe
        }
    }

    public async fetchOrGet(
        query: CorpusQuery,
        costScore: number,
        fetcher: () => Promise<any>
    ): Promise<{ data: any; cached: boolean }> {
        const key = this.generateKey(query);
        const lockKey = `${key}:lock`;
        //

        // 1. Check Redis (Fast Path)
        try {
            const cachedData = await this.redis.get(key);
            if (cachedData) {
                //
                return { data: JSON.parse(cachedData), cached: true };
            }
        } catch (e) { /* Ignore Redis error */ }

        // 2. Check In-Memory Coalescing (Single Instance optimization)
        if (this.inflight.has(key)) {
            //
            try {
                const result = await this.inflight.get(key);
                //
                return { data: result, cached: true };
            } catch (error) {
                //
                throw error;
            }
        }

        // 3. Attempt Distributed Lock (Cross-Instance coordination)
        const lockValue = crypto.randomUUID();
        const acquired = await this.redis.set(lockKey, lockValue, 'EX', 30, 'NX');

        if (!acquired) {
            //
            // Another instance is fetching. Wait for result to appear in Redis.
            const data = await this.waitForResult(key);
            if (data) {
                //
                return { data, cached: true };
            }
            //
            // Fallback: If we waited and still nothing (timeout), we try to fetch ourself.
        }

        //

        // 4. Execute Fetcher (and share promise in-memory)
        const promise = (async () => {
            try {
                const result = await fetcher();
                // 5. Cache Result (Fire & Forget)
                await this.set(query, result, costScore);
                //
                return result;
            } catch (err) {
                //
                throw err;
            } finally {
                // 6. Cleanup In-Memory and Distributed Lock
                this.inflight.delete(key);
                await this.redis.del(lockKey).catch(() => { });
                //
            }
        })();

        this.inflight.set(key, promise);

        try {
            const data = await promise;
            return { data, cached: false };
        } catch (e) {
            throw e;
        }
    }

    private async waitForResult(key: string, maxWaitMs = 10000): Promise<any | null> {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const data = await this.redis.get(key);
            if (data) {
                return JSON.parse(data);
            }
            // If lock is gone but no data, maybe the other instance failed.
            const lockExists = await this.redis.exists(`${key}:lock`);
            if (!lockExists) break;
        }
        return null;
    }

    public async set(query: CorpusQuery, result: any, costScore: number): Promise<void> {
        const key = this.generateKey(query);
        const ttl = costScore > 50 ? this.TTL_HIGH_COST : this.TTL_LOW_COST;

        try {
            await this.redis.set(key, JSON.stringify(result), 'EX', ttl);
        } catch (e) {
            // Ignore cache write failures
            console.error('Cache Write Failed:', e);
        }
    }

    private generateKey(query: CorpusQuery): string {
        const hash = crypto.createHash('sha256').update(JSON.stringify(query)).digest('hex');
        return `search:${query.corpus_id}:${hash}`;
    }
}
