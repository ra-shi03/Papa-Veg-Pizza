import { MemoryStore } from 'express-rate-limit';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Counter store for express-rate-limit.
 *
 * With several server processes (cluster / several machines behind a load balancer) an in-memory counter is per process, so
 * a limit of 30 would really be 30 x the number of processes. When Redis is on, every process counts in the same Redis key,
 * so the limit is one number for the whole system. When Redis is off (or down) it counts in this process's memory: limits
 * still work, just per process, and a failed Redis call never blocks a request.
 */
export class SharedRateLimitStore {
    constructor(name, getClient = getRedisClient) {
        this.getClient = getClient;
        this.prefix = `rl:${name}:`;
        this.local = new MemoryStore();
        this.warned = false;
    }

    init(options) {
        this.windowMs = options.windowMs;
        this.local.init(options);
    }

    redis() {
        const client = this.getClient();
        return client?.isReady ? client : null;
    }

    fail(err) {
        if (!this.warned) {
            logger.warn(`Rate limit store: Redis call failed, counting in memory for now (${err.message})`);
            this.warned = true;
        }
    }

    async increment(key) {
        const client = this.redis();
        if (!client) return this.local.increment(key);
        try {
            const k = this.prefix + key;
            const totalHits = await client.incr(k);
            if (totalHits === 1) await client.pExpire(k, this.windowMs);
            let ttl = await client.pTTL(k);
            if (ttl < 0) {                       // a key that lost its expiry would block forever: restore it
                await client.pExpire(k, this.windowMs);
                ttl = this.windowMs;
            }
            this.warned = false;
            return { totalHits, resetTime: new Date(Date.now() + ttl) };
        } catch (err) {
            this.fail(err);
            return this.local.increment(key);
        }
    }

    async decrement(key) {
        const client = this.redis();
        if (!client) return this.local.decrement(key);
        try {
            await client.decr(this.prefix + key);
        } catch (err) {
            this.fail(err);
            this.local.decrement(key);
        }
    }

    async resetKey(key) {
        this.local.resetKey(key);
        const client = this.redis();
        if (!client) return;
        try {
            await client.del(this.prefix + key);
        } catch (err) {
            this.fail(err);
        }
    }
}
