import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../src/features/editor/services/httpClient.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const webSrcDir = resolve(currentDir, '../src');

function collectTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Agent 05 - Central HTTP Client, Deduplication, Backoff & Zero Secrets', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deduplicates concurrent in-flight GET requests to the same endpoint', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((res) => {
          resolveFetch = res;
        }),
    );

    const p1 = httpClient.get<{ readonly ok: boolean }>('/api/v1/test-dedupe');
    const p2 = httpClient.get<{ readonly ok: boolean }>('/api/v1/test-dedupe');

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    resolveFetch?.({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as unknown as Response);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  it('retries transient failures with exponential backoff when retries > 0', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Transient failure'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ recovered: true }),
      } as unknown as Response);

    const result = await httpClient.get<{ readonly recovered: boolean }>('/api/v1/retry-test', {
      retries: 1,
      retryDelayMs: 5,
      deduplicate: false,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.recovered).toBe(true);
    }
  });

  it('returns TIMEOUT error when request exceeds timeoutMs', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        }),
    );

    const result = await httpClient.get('/api/v1/slow-endpoint', {
      timeoutMs: 20,
      deduplicate: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
    }
  });

  it('enforces a single fetch() call across apps/web/src and zero hardcoded API keys or http://colormind.io', () => {
    const files = collectTsFiles(webSrcDir);
    let totalFetchCalls = 0;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const fetchMatches = content.match(/\bfetch\s*\(/g) ?? [];
      totalFetchCalls += fetchMatches.length;

      if (fetchMatches.length > 0) {
        expect(file).toContain('httpClient.ts');
      }

      // Ensure zero leaked API keys or plaintext colormind URLs
      expect(content).not.toMatch(/VITE_UNSPLASH_ACCESS_KEY\s*\|\|\s*['"][A-Za-z0-9_-]{20,}['"]/);
      expect(content).not.toMatch(/GIPHY_API_KEY\s*=\s*['"][A-Za-z0-9_-]{16,}['"]/);
      expect(content).not.toContain('http://colormind.io');
    }

    expect(totalFetchCalls).toBe(1);
  });
});
