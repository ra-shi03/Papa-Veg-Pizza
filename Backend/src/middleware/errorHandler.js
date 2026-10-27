import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
    // multer limit errors are the caller's fault (413 too large, 400 too many files / fields)
    const statusCode = err.statusCode || (err.name === 'MulterError' ? (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400) : 500);
    const message = err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message || 'Server Error';
    const requestId = req.requestId || '-';

    logger.error(
        `[${requestId}] ${req.method} ${req.originalUrl} ${statusCode} - ${err.name || 'Error'} - ${message}`
    );
    if (config.nodeEnv === 'development' && err.stack) {
        logger.error(`[${requestId}] ${err.stack}`);
    }

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

export default errorHandler;
