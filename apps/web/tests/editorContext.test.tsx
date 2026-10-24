import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLocalStorage } from '../src/hooks/useLocalStorage.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const webSrcDir = resolve(currentDir, '../src');

function collectTsxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Agent 04 - State, Context & Component Partitioning', () => {
  it('persists and updates values through useLocalStorage with validator fallback', () => {
    window.localStorage.removeItem('pencel_test_key');

    const isStringArray = (val: unknown): val is readonly string[] =>
      Array.isArray(val) && val.every((item) => typeof item === 'string');

    const { result } = renderHook(() =>
      useLocalStorage<readonly string[]>('pencel_test_key', ['default'], isStringArray),
    );

    expect(result.current[0]).toEqual(['default']);

    act(() => {
      result.current[1](['#0071E3', '#1D1D1F']);
    });

    expect(result.current[0]).toEqual(['#0071E3', '#1D1D1F']);
    expect(JSON.parse(window.localStorage.getItem('pencel_test_key') ?? '[]')).toEqual([
      '#0071E3',
      '#1D1D1F',
    ]);

    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toEqual(['default']);
  });

  it('enforces that no React component (.tsx) in apps/web/src exceeds 300 lines or 15 hooks', () => {
    const tsxFiles = collectTsxFiles(webSrcDir);
    expect(tsxFiles.length).toBeGreaterThan(20);

    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf8');
      const lineCount = content.split(/\r?\n/).length;
      const hookMatches = content.match(/\buse[A-Z][A-Za-z0-9_]*\s*\(/g) ?? [];

      expect(lineCount, `Component ${file} exceeds 300 lines (${lineCount})`).toBeLessThanOrEqual(
        300,
      );
      expect(
        hookMatches.length,
        `Component ${file} exceeds 15 hook calls (${hookMatches.length})`,
      ).toBeLessThanOrEqual(15);
    }
  });

  it('verifies EditorRoute passes zero engine callbacks as props', () => {
    const editorRoutePath = resolve(webSrcDir, 'app/routes/EditorRoute.tsx');
    const content = readFileSync(editorRoutePath, 'utf8');
    expect(content).toContain('<EditorProvider>');
    expect(content).not.toMatch(/onAdd(Rectangle|Circle|Triangle|Text|ImageFromUrl)/);
  });
});
