import { createLogger } from '@unsa/logger';
import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const logger = createLogger('slides');

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

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}

function postgresCodeOf(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return undefined;
  }
  return typeof err.code === 'string' ? err.code : undefined;
}

export function isUniqueViolationError(err: unknown): boolean {
  if (postgresCodeOf(err) === '23505') return true;
  if (
    typeof err === 'object' &&
    err !== null &&
    'cause' in err &&
    postgresCodeOf(err.cause) === '23505'
  ) {
    return true;
  }
  if (!(err instanceof Error)) return false;
  return /duplicate key|unique constraint|unique violation|23505|owner_slug_uniq|presentation_version_uniq/i.test(
    err.message,
  );
}

export function isInvalidUuidError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /invalid input syntax for (type )?uuid/i.test(err.message);
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

  if (isUniqueViolationError(err)) {
    logger.warn('Unique constraint violation', {
      error: err instanceof Error ? err.name : 'Error',
      path: c.req.path,
    });
    return c.json(
      {
        error: 'ConflictError',
        message: 'Resource conflict; please retry',
      },
      409,
    );
  }

  if (isInvalidUuidError(err)) {
    logger.warn('Invalid UUID in request', {
      error: err instanceof Error ? err.name : 'Error',
      path: c.req.path,
    });
    return c.json(
      {
        error: 'NotFoundError',
        message: 'Presentation not found',
      },
      404,
    );
  }

  logger.error(err.message || 'An unexpected internal server error occurred', {
    err,
    path: c.req.path,
  });
  return c.json(
    {
      error: 'InternalServerError',
      message: 'An unexpected internal server error occurred',
    },
    500,
  );
};
