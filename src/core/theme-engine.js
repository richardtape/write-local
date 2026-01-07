/**
 * Theme Engine for Write Local
 * Handles loading base CSS and theme-specific CSS files
 */

import { db } from './storage.js';

// Track currently active theme
let activeTheme = null;

/**
 * Load a theme (base.css + theme-specific CSS)
 * @param {string} themeName - Name of theme to load (e.g., 'minimal', 'modern')
 */
export async function loadTheme(themeName) {
  // Always load base.css first if not already loaded
  let baseLink = document.querySelector('link[data-theme="base"]');
  if (!baseLink) {
    baseLink = document.createElement('link');
    baseLink.rel = 'stylesheet';
    baseLink.href = '/src/themes/base.css';
    baseLink.setAttribute('data-theme', 'base');
    document.head.appendChild(baseLink);

    // Wait for base to load
    await new Promise((resolve) => {
      baseLink.onload = resolve;
      baseLink.onerror = resolve; // Continue even if base fails
    });
  }

  // Remove any existing theme-specific stylesheet (but keep base)
  const existingTheme = document.querySelector('link[data-theme]:not([data-theme="base"])');
  if (existingTheme) {
    existingTheme.remove();
  }

  // Load the new theme CSS
  const themeLink = document.createElement('link');
  themeLink.rel = 'stylesheet';
  themeLink.href = `/src/themes/${themeName}.css`;
  themeLink.setAttribute('data-theme', themeName);
  document.head.appendChild(themeLink);

  // Wait for theme to load
  await new Promise((resolve) => {
    themeLink.onload = resolve;
    themeLink.onerror = resolve; // Continue even if theme fails
  });

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
    value: themeName
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
 * Reset theme engine state (for testing)
 * @private
 */
export function _resetThemeEngine() {
  activeTheme = null;
}
