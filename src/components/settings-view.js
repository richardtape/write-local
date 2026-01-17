import { getDefaultTheme, setDefaultTheme, loadTheme } from '../core/theme-engine.js';
import { renderSiteSettings } from './site-settings.js';

/**
 * Render the settings view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Configuration options
 * @param {Router} options.router - Router instance for navigation
 */
export async function renderSettingsView(container, options = {}) {
  const { router } = options;

  // Clear container
  container.innerHTML = '';

  // Get current default theme
  const currentDefaultTheme = await getDefaultTheme();

  // Create header
  const header = document.createElement('div');
  header.className = 'settings-header';
  header.innerHTML = `
    <button class="btn-back" data-action="back">← Back</button>
    <h2>Settings</h2>
  `;
  container.appendChild(header);

  // Add back button handler
  if (router) {
    const backBtn = header.querySelector('[data-action="back"]');
    backBtn.addEventListener('click', () => {
      router.navigate('/posts');
    });
  }

  // Create site settings section container
  const siteSettingsContainer = document.createElement('div');
  siteSettingsContainer.className = 'site-settings-container';
  container.appendChild(siteSettingsContainer);

  // Render site settings
  await renderSiteSettings(siteSettingsContainer, options);

  // Create themes section
  const themesSection = document.createElement('div');
  themesSection.className = 'settings-section';
  themesSection.innerHTML = `
    <h3>Post Themes</h3>
    <div class="settings-item">
      <label for="default-theme-select">Default Theme</label>
      <select id="default-theme-select">
        <option value="minimal" ${currentDefaultTheme === 'minimal' ? 'selected' : ''}>Minimal</option>
        <option value="modern" ${currentDefaultTheme === 'modern' ? 'selected' : ''}>Modern</option>
      </select>
      <p class="settings-help">
        Choose the default theme for new posts. You can override this per-post in the editor.
      </p>
    </div>
  `;
  container.appendChild(themesSection);

  // Add theme change handler
  const themeSelect = themesSection.querySelector('#default-theme-select');
  themeSelect.addEventListener('change', async (e) => {
    const selectedTheme = e.target.value;
    await setDefaultTheme(selectedTheme);
    await loadTheme(selectedTheme);
    console.log('Default theme updated and loaded:', selectedTheme);
  });
}
