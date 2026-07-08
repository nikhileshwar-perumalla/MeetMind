import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/** Central error handler. Normalizes Mongoose/JWT/validation errors into a clean response. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`${field} already exists`);
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    error = ApiError.unprocessable('Validation failed', details);
  }
  // JWT
  if (err.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') error = ApiError.unauthorized('Token expired');
  // Multer
  if (err.code === 'LIMIT_FILE_SIZE') error = ApiError.badRequest('File too large');

  if (!(error instanceof ApiError)) {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    error = ApiError.internal();
  } else if (error.statusCode >= 500) {
    logger.error('Server error', { message: error.message, stack: err.stack });
  }

  res.status(error.statusCode).json({
    error: {
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}
