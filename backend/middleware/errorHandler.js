/**
 * Global error handler middleware.
 * Handles Mongoose errors, JWT errors, and generic errors with
 * standardized JSON responses.
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // ── Mongoose bad ObjectId (CastError) ───────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose validation error ───────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // ── Mongoose duplicate key error ────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}. Please use another value.`;
  }

  // ── JWT errors ──────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please authenticate again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please authenticate again.';
  }

  // ── Build response ──────────────────────────────────────────────────────────
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // In production, hide internal error details for 500s
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.message = 'Internal Server Error';
  }

  console.error(`❌ [${statusCode}] ${message}`, process.env.NODE_ENV === 'development' ? err.stack : '');

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
