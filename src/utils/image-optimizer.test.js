import { describe, it, expect, beforeEach } from 'vitest';
import { optimizeImage, calculateDimensions } from './image-optimizer.js';

describe('Image Optimizer', () => {
  describe('calculateDimensions', () => {
    it('scales down large image maintaining aspect ratio (landscape)', () => {
      const result = calculateDimensions(3000, 2000, 1200, 1200);

      expect(result.width).toBe(1200);
      expect(result.height).toBe(800); // Maintains 3:2 ratio
    });

    it('scales down large image maintaining aspect ratio (portrait)', () => {
      const result = calculateDimensions(2000, 3000, 1200, 1200);

      expect(result.width).toBe(800);
      expect(result.height).toBe(1200); // Maintains 2:3 ratio
    });

    it('does not upscale small images', () => {
      const result = calculateDimensions(800, 600, 1200, 1200);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600); // No upscaling
    });

    it('handles square images', () => {
      const result = calculateDimensions(2000, 2000, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);
    });

    it('respects maxWidth constraint', () => {
      const result = calculateDimensions(4000, 2000, 1500, 3000);

      expect(result.width).toBe(1500);
      expect(result.height).toBe(750); // Limited by maxWidth
    });

    it('respects maxHeight constraint', () => {
      const result = calculateDimensions(2000, 4000, 3000, 1500);

      expect(result.width).toBe(750);
      expect(result.height).toBe(1500); // Limited by maxHeight
    });

    it('handles very wide images', () => {
      const result = calculateDimensions(5000, 1000, 1200, 1200);

      expect(result.width).toBe(1200);
      expect(result.height).toBe(240); // Maintains 5:1 ratio
    });

    it('handles very tall images', () => {
      const result = calculateDimensions(1000, 5000, 1200, 1200);

      expect(result.width).toBe(240);
      expect(result.height).toBe(1200); // Maintains 1:5 ratio
    });

    it('returns integer dimensions', () => {
      const result = calculateDimensions(1234, 567, 1000, 1000);

      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });
  });

  describe('optimizeImage', () => {
    // Note: These tests require browser Canvas API
    // In test environment (happy-dom), Canvas/createImageBitmap is not available
    // Full Canvas functionality will be tested manually in browser

    it('validates input blob', async () => {
      await expect(optimizeImage(null)).rejects.toThrow(/invalid blob/i);
    });

    it('validates quality range (> 1)', async () => {
      const blob = new Blob(['fake image data'], { type: 'image/png' });

      await expect(
        optimizeImage(blob, { quality: 1.5 })
      ).rejects.toThrow(/quality must be between 0 and 1/i);
    });

    it('validates quality range (< 0)', async () => {
      const blob = new Blob(['fake image data'], { type: 'image/png' });

      await expect(
        optimizeImage(blob, { quality: -0.5 })
      ).rejects.toThrow(/quality must be between 0 and 1/i);
    });

    // Canvas API tests are skipped in test environment (no createImageBitmap)
    // Full optimization functionality tested manually in browser using test-optimization.html
  });
});
