import { createClient } from 'redis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient = null;

/**
 * Creates a new Redis client instance based on configuration.
 * @returns {import('redis').RedisClientType|null}
 */
export const createRedisClient = () => {
    if (!config.redisUrl) {
        logger.warn('Redis URL not provided, Redis client will not be created.');
        return null;
    }

    const client = createClient({
        url: config.redisUrl
    });

    client.on('error', (err) => logger.error(`Redis Client Error: ${err.message}`));
    client.on('connect', () => logger.info('Redis connecting...'));
    client.on('ready', () => logger.info('Redis client ready'));
    client.on('end', () => logger.warn('Redis client disconnected'));

    return client;
};

export const REDIS_CONNECT_TIMEOUT_MS = 8000;

/** Rejects after `ms` so a Redis that does not answer cannot stop the whole server from starting. */
export const withConnectTimeout = (promise, ms = REDIS_CONNECT_TIMEOUT_MS) => {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Redis did not answer within ${ms / 1000}s`)), ms); });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/**
 * Connects to Redis if REDIS_ENABLED is true.
 * @returns {Promise<import('redis').RedisClientType|null>}
 */
export const connectRedis = async () => {
    const isRedisEnabled = config.redisEnabled;

    if (!isRedisEnabled) {
        logger.info('Redis is disabled via REDIS_ENABLED flag.');
        return null;
    }

    try {
        if (!redisClient) {
            redisClient = createRedisClient();
        }

        if (redisClient) {
            await withConnectTimeout(redisClient.connect());
            logger.info('Successfully connected to Redis');
        }
        return redisClient;
    } catch (error) {
        logger.error(`Failed to connect to Redis: ${error.message}. The server keeps starting; rate limits count per process until Redis is back.`);
        redisClient?.disconnect().catch(() => {});   // stop the endless reconnect loop; a restart reconnects
        redisClient = null;
        return null;
    }
};

/**
 * Returns the existing Redis client.
 * @returns {import('redis').RedisClientType|null}
 */
export const getRedisClient = () => {
    return redisClient;
};

/**
 * Close Redis connection (e.g. graceful shutdown).
 * @returns {Promise<void>}
 */
export const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info('Redis connection closed');
    }
};
