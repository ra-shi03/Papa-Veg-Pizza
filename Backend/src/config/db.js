import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Always prepend public DNS servers (Google + Cloudflare) so that MongoDB SRV lookups
// work regardless of the local DNS resolver (router IPv6, ISP DNS, VPN, etc.)
try {
    const currentServers = dns.getServers();
    // Filter out any already-present public servers to avoid duplicates
    const publicDns = ['8.8.8.8', '1.1.1.1'];
    const merged = [...publicDns, ...currentServers.filter(s => !publicDns.includes(s))];
    dns.setServers(merged);
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

