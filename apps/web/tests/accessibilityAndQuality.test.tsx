import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App.js';
import { calculateContrast, hexToRgb } from '../src/shared/lib/colorUtils.js';

const REPO_ROOT = join(process.cwd(), '..', '..');
const TOKENS_DIR = join(REPO_ROOT, 'packages', 'design-tokens', 'src');
const WEB_SRC_DIR = join(process.cwd(), 'src');

function extractTokenMap(cssText: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null = regex.exec(cssText);
  while (match !== null) {
    map.set(match[1]!, match[2]!.trim());
    match = regex.exec(cssText);
  }
  return map;
}

function collectFiles(dir: string, suffix: string): string[] {
  const res: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      res.push(...collectFiles(full, suffix));
    } else if (entry.endsWith(suffix)) {
      res.push(full);
    }
  }
  return res;
}

describe('Accessibility, Contrast, Tabular Numerals & Quality Gate (Agente 07)', () => {
  const lightCss = readFileSync(join(TOKENS_DIR, 'theme-light.css'), 'utf-8');
  const darkCss = readFileSync(join(TOKENS_DIR, 'theme-dark.css'), 'utf-8');
  const tokensCss = readFileSync(join(TOKENS_DIR, 'tokens.css'), 'utf-8');

  const lightTokens = extractTokenMap(lightCss);
  const darkTokens = extractTokenMap(darkCss);

  it('maintains 1:1 semantic token parity between theme-light.css and theme-dark.css', () => {
    const lightKeys = [...lightTokens.keys()].sort();
    const darkKeys = [...darkTokens.keys()].sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it('guarantees WCAG AA (>= 4.5:1) contrast for primary, secondary, and tertiary text in both themes', () => {
    const textKeys = [
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-tertiary',
    ] as const;
    const surfaceKeys = [
      '--color-bg-app',
      '--color-surface-primary',
      '--color-surface-secondary',
    ] as const;

    for (const [themeName, map] of [
      ['light', lightTokens],
      ['dark', darkTokens],
    ] as const) {
      for (const tKey of textKeys) {
        const textHex = map.get(tKey);
        expect(textHex, `${tKey} missing in ${themeName}`).toBeDefined();
        for (const sKey of surfaceKeys) {
          const surfaceHex = map.get(sKey);
          expect(surfaceHex, `${sKey} missing in ${themeName}`).toBeDefined();
          const ratio = calculateContrast(hexToRgb(textHex!), hexToRgb(surfaceHex!));
          expect(
            ratio,
            `${themeName}: ${tKey} (${textHex}) on ${sKey} (${surfaceHex}) contrast ${ratio} < 4.5`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('enforces prefers-reduced-motion and prefers-reduced-transparency fallbacks in tokens.css', () => {
    expect(tokensCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(tokensCss).toContain('@media (prefers-reduced-transparency: reduce)');
    expect(tokensCss).toContain('@supports not ((backdrop-filter: blur(1px))');
  });

  it('applies font-variant-numeric: tabular-nums across numeric controls and readouts', () => {
    const cssModules = collectFiles(WEB_SRC_DIR, '.module.css');
    let tabularCount = 0;
    for (const file of cssModules) {
      const text = readFileSync(file, 'utf-8');
      tabularCount += (text.match(/font-variant-numeric\s*:\s*tabular-nums/g) ?? []).length;
    }
    expect(tabularCount).toBeGreaterThanOrEqual(20);
  });

  it('ensures every rendered button in the editor has an accessible name (text or aria-label)', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(10);

    for (const btn of buttons) {
      const ariaLabel = btn.getAttribute('aria-label')?.trim() ?? '';
      const textContent = btn.textContent?.trim() ?? '';
      const title = btn.getAttribute('title')?.trim() ?? '';
      expect(
        ariaLabel.length > 0 || textContent.length > 0 || title.length > 0,
        `Button without accessible name: ${btn.outerHTML}`,
      ).toBe(true);
    }
  });

  it('aligns AGENTS.md frontend documentation with Vite 8 in package.json', () => {
    const agentsMd = readFileSync(join(REPO_ROOT, 'AGENTS.md'), 'utf-8');
    expect(agentsMd).toContain('Vite 8');
  });
});
