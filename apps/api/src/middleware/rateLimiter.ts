import type { RequestHandler } from 'express';

export interface RateLimiterOptions {
  readonly windowMs?: number;
  readonly maxRequests?: number;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * Native fixed-window in-memory rate-limiting middleware (zero-dependency equivalent to `express-rate-limit` per ADR 0013).
 */
export function createRateLimiterMiddleware(options: RateLimiterOptions = {}): RequestHandler {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 120;
  const buckets = new Map<string, RateBucket>();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
        },
      });
      return;
    }

    next();
  };
}
