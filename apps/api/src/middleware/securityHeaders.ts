import type { RequestHandler } from 'express';

/**
 * Native HTTP security headers middleware (zero-dependency equivalent to `helmet` as documented in ADR 0013).
 */
export function createSecurityHeadersMiddleware(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    next();
  };
}
