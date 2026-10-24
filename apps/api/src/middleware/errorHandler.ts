import type { ApiErrorResponse } from '@pencel/shared-types';
import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    status: 'error',
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} was not found on @pencel/api.`,
  };
  res.status(404).json(body);
}

export function centralizedErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    const body: ApiErrorResponse = {
      status: 'error',
      code: err.code,
      message: err.message,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected internal server error.';
  const body: ApiErrorResponse = {
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message,
  };
  res.status(500).json(body);
}
