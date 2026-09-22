import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

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

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

export type ErrorReport = (
  err: unknown,
  info: { path: string; statusCode: number },
) => void;

let errorReporter: ErrorReport = () => {};

export function setErrorReporter(reporter: ErrorReport): void {
  errorReporter = reporter;
}

export const globalErrorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    errorReporter(err, { path: c.req.path, statusCode: err.statusCode });
    return c.json(
      {
        error: err.name,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        statusCode: err.statusCode,
      },
      err.statusCode as ContentfulStatusCode,
    );
  }
  errorReporter(err, { path: c.req.path, statusCode: 500 });
  return c.json(
    {
      error: 'InternalServerError',
      message: err.message || 'An unexpected internal server error occurred',
      statusCode: 500,
    },
    500,
  );
};

export const notFoundHandler: NotFoundHandler = (c) =>
  c.json(
    { error: 'NotFoundError', message: 'Route not found', statusCode: 404 },
    404,
  );
