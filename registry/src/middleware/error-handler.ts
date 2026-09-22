import { createLogger } from '@unsa/logger';
import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const logger = createLogger('registry');

export class AppError extends Error {
  public statusCode: number;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 413, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}

export const globalErrorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    logger.warn(err.message, {
      error: err.name,
      statusCode: err.statusCode,
      path: c.req.path,
      ...(err.details ? { details: err.details } : {}),
    });
    return c.json(
      {
        error: err.name,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      err.statusCode as ContentfulStatusCode,
    );
  }

  logger.error(err.message || 'An unexpected internal server error occurred', {
    err,
    path: c.req.path,
  });
  return c.json(
    {
      error: 'InternalServerError',
      message: err.message || 'An unexpected internal server error occurred',
    },
    500,
  );
};
