import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../core/storage.js';
import { renderSettingsView } from './settings-view.js';
import { setDefaultTheme } from '../core/theme-engine.js';

describe('SettingsView Component', () => {
  let container;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'settings-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should render settings header', async () => {
    await renderSettingsView(container);

    expect(container.textContent).toContain('Settings');
  });

  it('should render themes section', async () => {
    await renderSettingsView(container);

    expect(container.textContent).toContain('Themes');
  });

  it('should render theme selector', async () => {
    await renderSettingsView(container);

    const themeSelect = container.querySelector('#default-theme-select');
    expect(themeSelect).toBeTruthy();
  });

  it('should show minimal and modern theme options', async () => {
    await renderSettingsView(container);

    const themeSelect = container.querySelector('#default-theme-select');
    const options = Array.from(themeSelect.options).map(opt => opt.value);

    expect(options).toContain('minimal');
    expect(options).toContain('modern');
  });

  it('should show current default theme as selected', async () => {
    await setDefaultTheme('modern');

    await renderSettingsView(container);

    const themeSelect = container.querySelector('#default-theme-select');
    expect(themeSelect.value).toBe('modern');
  });

  it('should update default theme when selection changes', async () => {
    await renderSettingsView(container);

    const themeSelect = container.querySelector('#default-theme-select');

    // Change selection
    themeSelect.value = 'modern';
    themeSelect.dispatchEvent(new Event('change'));

    // Wait for async update
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify theme was saved
    const setting = await db.settings.get('defaultTheme');
    expect(setting.value).toBe('modern');
  });
});
