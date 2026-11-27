import http from 'http';
import app from './src/app.js';
import { config } from './src/config/env.js';
import { validateConfig, validatePaymentSecrets } from './src/config/validateEnv.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { refreshGatewayCredentials } from './src/modules/food/settings/services/paymentGateway.service.js';
import { FoodPaymentGateway } from './src/modules/food/settings/models/paymentGateway.model.js';
import { connectRedis, closeRedis } from './src/config/redis.js';
import { initSocket } from './src/config/socket.js';
import { startOrderEventStream, stopOrderEventStream } from './src/modules/food/orders/services/order-events.service.js';
import { initializeQueues, closeBullMQConnection } from './src/queues/index.js';
import mongoose from 'mongoose';
import { isJobWorker } from './src/config/jobRole.js';
import { dispatchDueScheduledOrders } from './src/modules/food/orders/services/order-dispatch.service.js';
import { sweepStoreDelayAlerts } from './src/modules/food/admin/services/storeDelayAlert.service.js';

import { logger } from './src/utils/logger.js';
import { initializeFirebaseRealtime } from './src/config/firebase.js';
import { cleanupLegacySuperAdmin } from './src/core/admin/admin.seed.js';

const SHUTDOWN_TIMEOUT_MS = 10000;
let server = null;
let expireOffersInterval = null;
let scheduledDispatchInterval = null;
let storeDelayAlertInterval = null;

const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    app.locals.shuttingDown = true;   // /ready answers 503 from now on, so the load balancer stops sending new requests here
    if (!server) {
        process.exit(0);
        return;
    }
    server.close(async () => {
        try {
            await disconnectDB();
            await closeRedis();
            await closeBullMQConnection();
            if (expireOffersInterval) clearInterval(expireOffersInterval);
            if (scheduledDispatchInterval) clearInterval(scheduledDispatchInterval);
            if (storeDelayAlertInterval) clearInterval(storeDelayAlertInterval);
            await stopOrderEventStream();

            logger.info('Graceful shutdown complete');
            process.exit(0);
        } catch (err) {
            logger.error(`Shutdown error: ${err.message}`);
            process.exit(1);
        }
    });
    setTimeout(() => {
        logger.error('Shutdown timeout, forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
};

const startServer = async () => {
    try {
        validateConfig();
        initializeFirebaseRealtime();

        // 1. Connect to Database (MongoDB)
        await connectDB();
        await (await import('./src/core/notifications/models/notification.model.js')).dropLegacyNotificationIndex();
        await (await import('./src/modules/food/franchise/models/storeManager.model.js')).fixStaffEmailIndex();   // kitchen staff may have no email

        // Saved gateway secrets need PAYMENT_SECRETS_KEY in production (exits if missing)
        await validatePaymentSecrets(() => FoodPaymentGateway.countDocuments({}));

        // Use the payment gateway the super admin activated (falls back to .env until one is saved)
        await refreshGatewayCredentials().catch((e) => console.warn('Payment gateway credentials not loaded:', e.message));

        // Cleanup legacy Superadmin
        await cleanupLegacySuperAdmin();

        // 2. Create HTTP server from Express app
        const httpServer = http.createServer(app);

        // 3. Initialize Socket.IO with the HTTP server (Redis adapter when Redis enabled)
        await initSocket(httpServer);
        if (isJobWorker()) startOrderEventStream(); // order events to the store and franchise rooms (once for the whole system)
        if (isJobWorker()) (await import('./src/modules/food/pos/services/posOutbox.service.js')).startPosOutbox(); // orders out to each store's Pet Pooja

        if (config.redisEnabled) {
            await connectRedis();
        }
        
        // 5a. Watchdog: Recover stuck orders from previous run
        try {
            const { recoverStuckOrders } = await import('./src/modules/food/orders/services/order.service.js');
            if (isJobWorker()) await recoverStuckOrders();
        } catch (err) {
            logger.error(`Watchdog startup error: ${err.message}`);
        }

        // 5. Conditionally initialize BullMQ queues.
        // BullMQ requires Redis; skip queue bootstrap when Redis is disabled.
        if (config.bullmqEnabled && config.redisEnabled) {
            try {
                initializeQueues();
            } catch (err) {
                logger.error(`BullMQ initialization error (server continues): ${err.message}`);
            }
        } else if (config.bullmqEnabled && !config.redisEnabled) {
            logger.warn('BullMQ is enabled but Redis is disabled. Queue initialization skipped.');
        }

        // 6. Start the HTTP server with port fallback
        let currentPort = Number(config.port) || 5005;
        const startListening = () => {
            // Remove previous error listeners to avoid memory leaks on retry
            httpServer.removeAllListeners('error');
            
            server = httpServer.listen(currentPort, config.host, () => {
                logger.info(`Server running in ${config.nodeEnv} mode on ${config.host}:${currentPort}`);
                logger.info(`Process ${process.pid}: ${isJobWorker() ? 'job worker (runs the once-only background jobs)' : 'web only'}`);
                console.log(`🌐 [URL] http://localhost:${currentPort}`);
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    logger.warn(`Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`);
                    currentPort++;
                    startListening();
                } else {
                    logger.error(`Server Error: ${err.message}`);
                    process.exit(1);
                }
            });
        };
        startListening();

        // Keep the MongoDB connection warm: a tiny ping every 3 minutes prevents NAT idle timeouts. (This timer used to
        // expire the retired FoodOffer records; coupons now come only from Marketing > Coupons, which need no job.)
        const keepDbAlive = async () => {
            try {
                await mongoose.connection.db?.admin().ping();
            } catch (err) {
                logger.error(`MongoDB keep-alive ping error: ${err.message}`);
            }
        };
        expireOffersInterval = setInterval(keepDbAlive, 3 * 60 * 1000);

        // Scheduled orders: start looking for a rider when the slot is near (once a minute)
        const runScheduledDispatch = async () => {
            try {
                await dispatchDueScheduledOrders();
            } catch (err) {
                logger.error(`Scheduled dispatch error: ${err.message}`);
            }
        };
        if (isJobWorker()) scheduledDispatchInterval = setInterval(runScheduledDispatch, 60 * 1000);

        // Store Delay Alerts: tell the admins' devices about orders a store has not accepted in time (once a minute)
        const runStoreDelayAlerts = async () => {
            try {
                await sweepStoreDelayAlerts();
            } catch (err) {
                logger.error(`Store delay alert sweep error: ${err.message}`);
            }
        };
        if (isJobWorker()) storeDelayAlertInterval = setInterval(runStoreDelayAlerts, 60 * 1000);

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error(`Unhandled Rejection: ${err?.message || err}`);
            if (config.nodeEnv === 'production') {
                if (server) server.close(() => process.exit(1));
                else process.exit(1);
            }
        });

        process.on('uncaughtException', (err) => {
            logger.error(`Uncaught Exception: ${err?.message || err}`);
            if (config.nodeEnv === 'production') {
                process.exit(1);
            }
        });

    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();

