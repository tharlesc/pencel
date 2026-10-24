/**
 * @pencel/web - Centralized HTTP Client
 * Single point of network access (`fetch`) across the frontend application.
 * Features:
 * - Base URL resolution via `import.meta.env.VITE_API_BASE_URL`
 * - Configurable timeout with chained `AbortSignal`
 * - Exponential backoff retry
 * - In-flight GET request deduplication
 * - Strictly typed `Result<T, HttpError>` return (never throws unhandled rejections)
 */

export type HttpErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'ABORTED' | 'HTTP_ERROR' | 'PARSE_ERROR';

export interface HttpError {
  readonly code: HttpErrorCode;
  readonly message: string;
  readonly status?: number;
  readonly url: string;
}

export type Result<T, E = HttpError> =
  | { readonly ok: true; readonly data: T; readonly status: number }
  | { readonly ok: false; readonly error: E };

export type HttpResponseType = 'json' | 'text' | 'blob';

export interface HttpRequestOptions<B = unknown> {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: B;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly retries?: number;
  readonly retryDelayMs?: number;
  readonly responseType?: HttpResponseType;
  readonly deduplicate?: boolean;
}

const DEFAULT_TIMEOUT_MS = 7000;
const DEFAULT_RETRY_DELAY_MS = 150;

const inFlightGetRequests = new Map<string, Promise<Result<unknown, HttpError>>>();

export function getApiBaseUrl(): string {
  try {
    const raw = import.meta.env?.VITE_API_BASE_URL;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim().replace(/\/+$/, '');
    }
  } catch {
    // Fallback in non-Vite test environments
  }
  return '/api/v1';
}

export function resolveRequestUrl(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const baseUrl = getApiBaseUrl();
  if (trimmed.startsWith('/api/v1')) {
    const suffix = trimmed.slice('/api/v1'.length);
    return `${baseUrl}${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
  }

  return `${baseUrl}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function createChainedAbortSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): {
  readonly signal: AbortSignal;
  readonly cleanup: () => void;
  readonly isTimeout: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;

  const timerId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = (): void => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const cleanup = (): void => {
    clearTimeout(timerId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  };

  return {
    signal: controller.signal,
    cleanup,
    isTimeout: () => timedOut,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function executeSingleRequest<T, B = unknown>(
  resolvedUrl: string,
  options: HttpRequestOptions<B>,
): Promise<Result<T, HttpError>> {
  const method = options.method ?? 'GET';
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const responseType = options.responseType ?? 'json';

  const { signal, cleanup, isTimeout } = createChainedAbortSignal(options.signal, timeoutMs);

  try {
    const headers: Record<string, string> = {
      ...(responseType === 'json' ? { Accept: 'application/json' } : {}),
      ...(options.headers ?? {}),
    };

    let serializedBody: string | undefined;
    if (options.body !== undefined) {
      if (typeof options.body === 'string') {
        serializedBody = options.body;
      } else {
        serializedBody = JSON.stringify(options.body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(resolvedUrl, {
      method,
      headers,
      ...(serializedBody !== undefined ? { body: serializedBody } : {}),
      signal,
    });

    const status = response.status ?? (response.ok ? 200 : 500);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: 'HTTP_ERROR',
          message: `HTTP ${status}`,
          status,
          url: resolvedUrl,
        },
      };
    }

    try {
      let data: T;
      if (responseType === 'text') {
        data = (await response.text()) as unknown as T;
      } else if (responseType === 'blob') {
        data = (await response.blob()) as unknown as T;
      } else {
        data = (await response.json()) as T;
      }

      return {
        ok: true,
        data,
        status,
      };
    } catch (parseErr) {
      return {
        ok: false,
        error: {
          code: 'PARSE_ERROR',
          message: parseErr instanceof Error ? parseErr.message : 'Failed to parse response body',
          status,
          url: resolvedUrl,
        },
      };
    }
  } catch (err) {
    if (isTimeout()) {
      return {
        ok: false,
        error: {
          code: 'TIMEOUT',
          message: `Request timed out after ${timeoutMs}ms`,
          url: resolvedUrl,
        },
      };
    }

    if (options.signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      return {
        ok: false,
        error: {
          code: 'ABORTED',
          message: 'Request was aborted',
          url: resolvedUrl,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network request failed',
        url: resolvedUrl,
      },
    };
  } finally {
    cleanup();
  }
}

export async function httpRequest<T, B = unknown>(
  endpoint: string,
  options: HttpRequestOptions<B> = {},
): Promise<Result<T, HttpError>> {
  const method = options.method ?? 'GET';
  const resolvedUrl = resolveRequestUrl(endpoint);
  const responseType = options.responseType ?? 'json';
  const shouldDeduplicate = method === 'GET' && options.deduplicate !== false;
  const dedupeKey = `${method}:${responseType}:${resolvedUrl}`;

  if (shouldDeduplicate) {
    const existing = inFlightGetRequests.get(dedupeKey);
    if (existing) {
      return existing as Promise<Result<T, HttpError>>;
    }
  }

  const runWithRetry = async (): Promise<Result<T, HttpError>> => {
    const maxRetries = Math.max(0, options.retries ?? 0);
    const baseDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

    let lastResult: Result<T, HttpError> | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = baseDelay * 2 ** (attempt - 1);
        await delay(backoffMs);
      }

      lastResult = await executeSingleRequest<T, B>(resolvedUrl, options);
      if (lastResult.ok) {
        return lastResult;
      }

      // Do not retry if explicitly aborted by caller or client 4xx error (except 429)
      if (
        lastResult.error.code === 'ABORTED' ||
        (lastResult.error.code === 'HTTP_ERROR' &&
          lastResult.error.status !== undefined &&
          lastResult.error.status >= 400 &&
          lastResult.error.status < 500 &&
          lastResult.error.status !== 429)
      ) {
        return lastResult;
      }
    }

    return (
      lastResult ?? {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Request failed',
          url: resolvedUrl,
        },
      }
    );
  };

  const promise = runWithRetry();

  if (shouldDeduplicate) {
    inFlightGetRequests.set(dedupeKey, promise as Promise<Result<unknown, HttpError>>);
    void promise.finally(() => {
      inFlightGetRequests.delete(dedupeKey);
    });
  }

  return promise;
}

export const httpClient = {
  request: httpRequest,
  get<T>(
    endpoint: string,
    options?: Omit<HttpRequestOptions<never>, 'method' | 'body'>,
  ): Promise<Result<T, HttpError>> {
    return httpRequest<T>(endpoint, { ...options, method: 'GET' });
  },
  post<T, B = unknown>(
    endpoint: string,
    body?: B,
    options?: Omit<HttpRequestOptions<B>, 'method' | 'body'>,
  ): Promise<Result<T, HttpError>> {
    return httpRequest<T, B>(endpoint, { ...options, method: 'POST', body });
  },
  getText(
    endpoint: string,
    options?: Omit<HttpRequestOptions<never>, 'method' | 'body' | 'responseType'>,
  ): Promise<Result<string, HttpError>> {
    return httpRequest<string>(endpoint, { ...options, method: 'GET', responseType: 'text' });
  },
  getBlob(
    endpoint: string,
    options?: Omit<HttpRequestOptions<never>, 'method' | 'body' | 'responseType'>,
  ): Promise<Result<Blob, HttpError>> {
    return httpRequest<Blob>(endpoint, { ...options, method: 'GET', responseType: 'blob' });
  },
};
