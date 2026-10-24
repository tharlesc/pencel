import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB_SRC_DIR = join(process.cwd(), 'src');
const TARGET_DIRS = [
  join(WEB_SRC_DIR, 'components', 'layout'),
  join(WEB_SRC_DIR, 'features', 'editor', 'components'),
];

function collectCssModules(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectCssModules(full));
    } else if (entry.endsWith('.module.css')) {
      results.push(full);
    }
  }
  return results;
}

describe('Editor Surfaces & Layout CSS Modules (Agente 03)', () => {
  const cssModuleFiles = TARGET_DIRS.flatMap((dir) => collectCssModules(dir));

  it('discovers all 8 editor surface and layout CSS Modules', () => {
    expect(cssModuleFiles.length).toBeGreaterThanOrEqual(8);
  });

  it('contains zero hex color literals, zero rgba() calls, zero px literals, and zero raw backdrop-filter rules', () => {
    for (const file of cssModuleFiles) {
      const rel = relative(WEB_SRC_DIR, file);
      const raw = readFileSync(file, 'utf-8');
      const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '');

      const hexMatches = stripped.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const rgbaMatches = stripped.match(/rgba?\s*\(/gi) ?? [];
      const pxMatches = stripped.match(/\b\d+(?:\.\d+)?px\b/g) ?? [];
      const backdropMatches = stripped.match(/backdrop-filter\s*:/gi) ?? [];

      expect(hexMatches, `Unexpected hex literal in ${rel}`).toEqual([]);
      expect(rgbaMatches, `Unexpected rgb/rgba() in ${rel}`).toEqual([]);
      expect(pxMatches, `Unexpected px literal in ${rel}`).toEqual([]);
      expect(backdropMatches, `Unexpected backdrop-filter in ${rel}`).toEqual([]);
    }
  });
});
