/**
 * Theme Engine for Write Local
 * Handles loading base CSS and theme-specific CSS files
 *
 * CSS is imported at build time and injected as <style> tags.
 * This ensures themes work regardless of domain or server configuration.
 */

import { db } from './storage.js';

// Import CSS files as raw strings using Vite's ?raw suffix
import baseCSS from '../themes/base.css?raw';
import minimalCSS from '../themes/minimal.css?raw';
import modernCSS from '../themes/modern.css?raw';

// Theme CSS map
const THEME_CSS = {
  minimal: minimalCSS,
  modern: modernCSS,
};

// Track currently active theme
let activeTheme = null;

/**
 * Load a theme (base.css + theme-specific CSS)
 * Injects CSS as <style> tags for reliable loading
 * @param {string} themeName - Name of theme to load (e.g., 'minimal', 'modern')
 */
export async function loadTheme(themeName) {
  // Always inject base.css first if not already present
  let baseStyle = document.querySelector('style[data-theme="base"]');
  if (!baseStyle) {
    baseStyle = document.createElement('style');
    baseStyle.setAttribute('data-theme', 'base');
    baseStyle.textContent = baseCSS;
    document.head.appendChild(baseStyle);
  }

  // Remove any existing theme-specific stylesheet (but keep base)
  const existingTheme = document.querySelector('style[data-theme]:not([data-theme="base"])');
  if (existingTheme) {
    existingTheme.remove();
  }

  // Get the theme CSS (fall back to minimal if unknown theme)
  const themeCSS = THEME_CSS[themeName] || THEME_CSS.minimal;

  // Inject the new theme CSS
  const themeStyle = document.createElement('style');
  themeStyle.setAttribute('data-theme', themeName);
  themeStyle.textContent = themeCSS;
  document.head.appendChild(themeStyle);

  // Update active theme
  activeTheme = themeName;
}

/**
 * Get currently active theme name
 * @returns {string|null} Theme name or null if none loaded
 */
export function getActiveTheme() {
  return activeTheme;
}

/**
 * Set default theme in settings
 * @param {string} themeName - Theme name to set as default
 */
export async function setDefaultTheme(themeName) {
  await db.settings.put({
    key: 'defaultTheme',
    value: themeName,
  });
}

/**
 * Get default theme from settings
 * @returns {Promise<string>} Theme name (defaults to 'minimal' if not set)
 */
export async function getDefaultTheme() {
  const setting = await db.settings.get('defaultTheme');
  return setting?.value || 'minimal';
}

/**
 * Get list of available themes
 * @returns {Array<{id: string, name: string}>} Available themes
 */
export function getAvailableThemes() {
  return [
    { id: 'minimal', name: 'Minimal' },
    { id: 'modern', name: 'Modern' },
  ];
}

/**
 * Reset theme engine state (for testing)
 * @private
 */
export function _resetThemeEngine() {
  activeTheme = null;

  // Remove injected styles
  const themeStyles = document.querySelectorAll('style[data-theme]');
  themeStyles.forEach((style) => style.remove());
}
