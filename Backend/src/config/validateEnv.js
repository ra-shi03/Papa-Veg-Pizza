import { config } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Validates required environment configuration on startup.
 * Logs clear errors and exits if critical variables are missing.
 */
export const validateConfig = () => {
    const missing = [];

    if (!config.mongodbUri) {
        missing.push('MONGO_URI or MONGODB_URI');
    }
    if (!config.jwtAccessSecret) {
        missing.push('JWT_ACCESS_SECRET or JWT_SECRET');
    }
    if (!config.jwtRefreshSecret) {
        missing.push('JWT_REFRESH_SECRET');
    }
    if (config.redisEnabled && !config.redisUrl) {
        missing.push('REDIS_URL (required when REDIS_ENABLED=true)');
    }
    if (config.bullmqEnabled && !config.redisEnabled) {
        missing.push('REDIS_ENABLED=true (required when BULLMQ_ENABLED=true)');
    }

    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (config.nodeEnv === 'production') {
        if (config.useDefaultOtpRequested) {
            logger.warn('USE_DEFAULT_OTP=true is ignored in production: real OTPs are generated and sent by SMS.');
        }
        if (config.corsOrigins.length === 0) {
            logger.warn('FRONTEND_URL is not set: browser requests from other origins will be blocked by CORS.');
        } else if (config.corsOrigins.every((o) => /localhost|127\.0\.0\.1/.test(o))) {
            logger.warn(`FRONTEND_URL only allows local origins (${config.corsOrigins.join(', ')}); set it to your real site URL(s).`);
        }
    }
};
