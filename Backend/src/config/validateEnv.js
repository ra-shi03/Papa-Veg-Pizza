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
        if (config.useDefaultOtpRequested && config.allowDefaultOtpInProduction) {
            const phones = config.testOtpPhones || [];
            logger.warn(
                '!!! DEFAULT OTP 123456 IS ACTIVE IN PRODUCTION (USE_DEFAULT_OTP=true + ALLOW_DEFAULT_OTP_IN_PRODUCTION=true). ' +
                (phones.length
                    ? `Only for the ${phones.length} number(s) in TEST_OTP_PHONES; every other number is refused an OTP. `
                    : 'For EVERY phone number: anyone can sign in as any customer or delivery partner with 123456. Set TEST_OTP_PHONES to limit it. ') +
                'No login SMS is sent. Admin password-reset OTPs are not affected. Remove this switch before the real launch.'
            );
        } else if (config.useDefaultOtpRequested) {
            logger.warn('USE_DEFAULT_OTP=true is ignored in production: real OTPs are generated and sent by SMS.');
        } else if (config.allowDefaultOtpInProduction) {
            logger.warn('ALLOW_DEFAULT_OTP_IN_PRODUCTION=true has no effect without USE_DEFAULT_OTP=true: real OTPs are generated and sent by SMS.');
        }
        if (config.corsOrigins.length === 0) {
            logger.error('FRONTEND_URL is not set. In production it must list the site origin(s) that may call this API and open sockets, e.g. FRONTEND_URL=https://app.example.com,https://admin.example.com. Refusing to start.');
            process.exit(1);
        } else if (config.corsOrigins.every((o) => /localhost|127\.0\.0\.1/.test(o))) {
            logger.warn(`FRONTEND_URL only allows local origins (${config.corsOrigins.join(', ')}); set it to your real site URL(s).`);
        }
    }
};
