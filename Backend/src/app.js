import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'mongo-sanitize';
import xssClean from 'xss-clean';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { responseTimeLogger } from './middleware/responseTimeLogger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { healthCheck } from './config/health.js';
import { config } from './config/env.js';
import { localUploadRoot } from './services/imageStorage.service.js';
import mongoose from 'mongoose';

const app = express();

// Trust first proxy (essential for express-rate-limit if behind a proxy)
app.set('trust proxy', 1);

// Request ID tracing (before other middlewares so all logs can use it)
app.use(requestIdMiddleware);

// Health endpoints (no rate limit, minimal JSON, no secrets)
app.get('/health', async (_req, res) => {
    try {
        const data = await healthCheck();
        res.status(200).json(data);
    } catch (err) {
        res.status(503).json({ status: 'DOWN', error: 'Health check failed' });
    }
});
// Readiness for the load balancer: 503 while shutting down or when MongoDB is not connected, so it takes this process out of
// rotation and puts it back by itself. (/health is the fuller check and stays 200 while the process is up.)
app.get('/ready', (_req, res) => {
    if (app.locals.shuttingDown || mongoose.connection.readyState !== 1) {
        return res.status(503).json({ status: 'not_ready' });
    }
    res.status(200).json({ status: 'ready' });
});

// Security & parsing middlewares
app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    hsts: config.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
// Browser origins must be listed in FRONTEND_URL (comma-separated). Outside production, local and
// private-network origins (Vite on a LAN IP, phone testing) are also allowed. Requests with no
// Origin header (mobile apps, webhooks, curl) are not browser CORS requests and pass through.
const isDevOrigin = (o) =>
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(o);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, '');
        if (config.corsOrigins.includes(normalized)) return callback(null, true);
        if (config.nodeEnv !== 'production' && isDevOrigin(normalized)) return callback(null, true);
        return callback(null, false);
    }
}));
app.use(morgan('dev'));

// Developer > Image Setting: images stored on this server's disk. The apps load them from other domains, so they are
// marked cross-origin (helmet's default would block them); no directory listings, no dotfiles.
app.use('/uploads', express.static(localUploadRoot(), {
    index: false,
    dotfiles: 'deny',
    maxAge: '30d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));
// Pet Pooja's Push Menu carries a whole menu (items, add-ons, nutrition): it alone gets a larger body limit
const posMenuJson = express.json({ limit: '5mb' });
app.use((req, res, next) => (/^\/api\/v1\/pos\/petpooja\/hooks\/[^/]+\/pushmenu\/?$/.test(req.path) ? posMenuJson(req, res, next) : next()));
app.use(express.json({
    verify: (req, res, buf) => {
        // ✅ Store rawBody for signature verification (Razorpay Webhooks)
        if (req.originalUrl && req.originalUrl.includes('/webhook/razorpay')) {
            req.rawBody = buf;
        }
    }
}));
app.use(express.urlencoded({ extended: true }));

// Protect against NoSQL injection and XSS
app.use((req, _res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
});
app.use(xssClean());

// Global rate limiting for API routes
app.use('/api', apiRateLimiter);

// Optional: log API response time (method, path, status, duration) - no sensitive data
app.use('/api', responseTimeLogger);

// API Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export default app;
