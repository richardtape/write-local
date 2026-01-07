import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadTheme, getActiveTheme, setDefaultTheme, getDefaultTheme, _resetThemeEngine } from './theme-engine.js';
import { db } from './storage.js';

describe('Theme Engine', () => {
  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Clear any existing theme stylesheets
    document.querySelectorAll('link[data-theme]').forEach(el => el.remove());
    // Reset theme engine state
    _resetThemeEngine();
  });

  afterEach(() => {
    // Cleanup
    document.querySelectorAll('link[data-theme]').forEach(el => el.remove());
  });

  describe('loadTheme', () => {
    it('should load base.css first', async () => {
      await loadTheme('minimal');

      const baseLink = document.querySelector('link[data-theme="base"]');
      expect(baseLink).toBeTruthy();
      expect(baseLink.href).toContain('base.css');
    });

    it('should load theme CSS after base', async () => {
      await loadTheme('minimal');

      const themeLink = document.querySelector('link[data-theme="minimal"]');
      expect(themeLink).toBeTruthy();
      expect(themeLink.href).toContain('minimal.css');
    });

    it('should load different themes', async () => {
      await loadTheme('modern');

      const themeLink = document.querySelector('link[data-theme="modern"]');
      expect(themeLink).toBeTruthy();
      expect(themeLink.href).toContain('modern.css');
    });

    it('should replace existing theme when loading new one', async () => {
      await loadTheme('minimal');
      await loadTheme('modern');

      // Should only have base + modern, not minimal
      const minimalLink = document.querySelector('link[data-theme="minimal"]');
      const modernLink = document.querySelector('link[data-theme="modern"]');

      expect(minimalLink).toBeNull();
      expect(modernLink).toBeTruthy();
    });

    it('should keep base.css when switching themes', async () => {
      await loadTheme('minimal');
      await loadTheme('modern');

      const baseLink = document.querySelector('link[data-theme="base"]');
      expect(baseLink).toBeTruthy();
    });

    it('should set active theme', async () => {
      await loadTheme('minimal');

      expect(getActiveTheme()).toBe('minimal');
    });
  });

  describe('getActiveTheme', () => {
    it('should return null when no theme loaded', () => {
      expect(getActiveTheme()).toBeNull();
    });

    it('should return current theme name', async () => {
      await loadTheme('modern');

      expect(getActiveTheme()).toBe('modern');
    });
  });

  describe('Default Theme Settings', () => {
    it('should set default theme', async () => {
      await setDefaultTheme('minimal');

      const defaultTheme = await getDefaultTheme();
      expect(defaultTheme).toBe('minimal');
    });

    it('should get default theme', async () => {
      await setDefaultTheme('modern');

      const defaultTheme = await getDefaultTheme();
      expect(defaultTheme).toBe('modern');
    });

    it('should return "minimal" as fallback if no default set', async () => {
      const defaultTheme = await getDefaultTheme();
      expect(defaultTheme).toBe('minimal');
    });

    it('should update default theme', async () => {
      await setDefaultTheme('minimal');
      await setDefaultTheme('modern');

      const defaultTheme = await getDefaultTheme();
      expect(defaultTheme).toBe('modern');
    });
  });
});
