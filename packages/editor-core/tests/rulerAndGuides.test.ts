import { describe, expect, it } from 'vitest';
import {
  calculateRulerTicks,
  getRulerStep,
  snapGuidePosition,
  type GuideLine,
} from '../src/math/rulerAndGuides.js';

describe('Ruler & Guides Math Engine (Photoshop Fidelity)', () => {
  describe('getRulerStep', () => {
    it('returns appropriate step sizes for 100% zoom', () => {
      const step = getRulerStep(1.0, 50);
      expect(step).toBe(50);
    });

    it('adapts step size for 200% zoom (closer ticks)', () => {
      const step = getRulerStep(2.0, 50);
      expect(step).toBe(25);
    });

    it('adapts step size for 25% zoom (wider ticks)', () => {
      const step = getRulerStep(0.25, 50);
      expect(step).toBe(200);
    });
  });

  describe('calculateRulerTicks', () => {
    it('generates major, medium and minor ticks with labels', () => {
      const ticks = calculateRulerTicks({
        origin: 100, // screen pos where doc 0 is
        zoom: 1.0,
        length: 300,
        startOffset: 24,
      });

      expect(ticks.length).toBeGreaterThan(0);
      const majorTicks = ticks.filter((t) => t.type === 'major');
      expect(majorTicks.length).toBeGreaterThan(0);

      // Major tick at doc 0 should have label '0' and position 100
      const zeroTick = majorTicks.find((t) => t.value === 0);
      expect(zeroTick).toBeDefined();
      expect(zeroTick?.position).toBe(100);
      expect(zeroTick?.label).toBe('0');
    });

    it('returns empty array when length <= startOffset', () => {
      const ticks = calculateRulerTicks({
        origin: 0,
        zoom: 1.0,
        length: 20,
        startOffset: 24,
      });
      expect(ticks).toEqual([]);
    });
  });

  describe('snapGuidePosition', () => {
    it('snaps to artboard origin (0) within threshold', () => {
      const result = snapGuidePosition({
        position: 3,
        orientation: 'vertical',
        pageSize: { width: 1080, height: 1080 },
        zoom: 1.0,
        thresholdPx: 6,
      });

      expect(result.isSnapped).toBe(true);
      expect(result.position).toBe(0);
    });

    it('snaps to artboard center within threshold', () => {
      const result = snapGuidePosition({
        position: 538,
        orientation: 'horizontal',
        pageSize: { width: 1080, height: 1080 },
        zoom: 1.0,
        thresholdPx: 6,
      });

      expect(result.isSnapped).toBe(true);
      expect(result.position).toBe(540); // 1080 / 2
    });

    it('snaps to existing guides', () => {
      const existingGuides: GuideLine[] = [{ id: 'g1', orientation: 'vertical', position: 350 }];

      const result = snapGuidePosition({
        position: 352,
        orientation: 'vertical',
        pageSize: { width: 1080, height: 1080 },
        existingGuides,
        zoom: 1.0,
        thresholdPx: 6,
      });

      expect(result.isSnapped).toBe(true);
      expect(result.position).toBe(350);
    });

    it('does not snap when distance exceeds threshold', () => {
      const result = snapGuidePosition({
        position: 215,
        orientation: 'vertical',
        pageSize: { width: 1080, height: 1080 },
        zoom: 1.0,
        thresholdPx: 6,
      });

      expect(result.isSnapped).toBe(false);
      expect(result.position).toBe(215);
    });
  });
});
