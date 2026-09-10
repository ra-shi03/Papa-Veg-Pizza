import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Ensure Node.js DNS resolver has fallback public DNS servers for SRV queries (fixes ECONNREFUSED on Windows loopback DNS)
try {
    const currentServers = dns.getServers();
    if (currentServers.includes('127.0.0.1') || currentServers.includes('::1') || currentServers.length === 0) {
        dns.setServers(['8.8.8.8', '1.1.1.1', ...currentServers]);
    }
} catch (e) {
    // Ignore if DNS server configuration fails
}

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri);
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Close MongoDB connection (e.g. graceful shutdown).
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
};

