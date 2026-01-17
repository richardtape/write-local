import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadTheme,
  getActiveTheme,
  setDefaultTheme,
  getDefaultTheme,
  getAvailableThemes,
  _resetThemeEngine,
} from './theme-engine.js';
import { db } from './storage.js';

describe('Theme Engine', () => {
  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Reset theme engine state (also removes injected styles)
    _resetThemeEngine();
  });

  afterEach(() => {
    // Cleanup any remaining theme styles
    document.querySelectorAll('style[data-theme]').forEach((el) => el.remove());
  });

  describe('loadTheme', () => {
    it('should inject base.css first', async () => {
      await loadTheme('minimal');

      const baseStyle = document.querySelector('style[data-theme="base"]');
      expect(baseStyle).toBeTruthy();
      expect(baseStyle.textContent).toContain('--color-background');
    });

    it('should inject theme CSS after base', async () => {
      await loadTheme('minimal');

      const themeStyle = document.querySelector('style[data-theme="minimal"]');
      expect(themeStyle).toBeTruthy();
      expect(themeStyle.textContent).toContain(':root');
    });

    it('should load different themes', async () => {
      await loadTheme('modern');

      const themeStyle = document.querySelector('style[data-theme="modern"]');
      expect(themeStyle).toBeTruthy();
      expect(themeStyle.textContent).toContain(':root');
    });

    it('should replace existing theme when loading new one', async () => {
      await loadTheme('minimal');
      await loadTheme('modern');

      // Should only have base + modern, not minimal
      const minimalStyle = document.querySelector('style[data-theme="minimal"]');
      const modernStyle = document.querySelector('style[data-theme="modern"]');

      expect(minimalStyle).toBeNull();
      expect(modernStyle).toBeTruthy();
    });

    it('should keep base.css when switching themes', async () => {
      await loadTheme('minimal');
      await loadTheme('modern');

      const baseStyle = document.querySelector('style[data-theme="base"]');
      expect(baseStyle).toBeTruthy();
    });

    it('should set active theme', async () => {
      await loadTheme('minimal');

      expect(getActiveTheme()).toBe('minimal');
    });

    it('should fall back to minimal for unknown themes', async () => {
      await loadTheme('nonexistent');

      // Should still inject a theme style (minimal as fallback)
      const themeStyles = document.querySelectorAll('style[data-theme]:not([data-theme="base"])');
      expect(themeStyles.length).toBe(1);
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

  describe('getAvailableThemes', () => {
    it('should return list of available themes', () => {
      const themes = getAvailableThemes();

      expect(themes).toContainEqual({ id: 'minimal', name: 'Minimal' });
      expect(themes).toContainEqual({ id: 'modern', name: 'Modern' });
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

  describe('_resetThemeEngine', () => {
    it('should remove all injected theme styles', async () => {
      await loadTheme('minimal');

      _resetThemeEngine();

      const themeStyles = document.querySelectorAll('style[data-theme]');
      expect(themeStyles.length).toBe(0);
    });

    it('should reset active theme to null', async () => {
      await loadTheme('minimal');

      _resetThemeEngine();

      expect(getActiveTheme()).toBeNull();
    });
  });
});
