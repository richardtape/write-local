import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, createSite, getSite, listSites } from '../core/storage.js';
import { renderSiteSettings } from './site-settings.js';

describe('SiteSettings Component', () => {
  let container;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'site-settings-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('when no site exists', () => {
    it('should show create site form', async () => {
      await renderSiteSettings(container);

      expect(container.textContent).toContain('Create Your Blog');
    });

    it('should have site name input', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      expect(nameInput).toBeTruthy();
    });

    it('should create site when form is submitted', async () => {
      await renderSiteSettings(container);

      // Fill in site name
      const nameInput = container.querySelector('#site-name');
      nameInput.value = 'My Awesome Blog';

      // Submit form
      const form = container.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify site was created
      const sites = await listSites();
      expect(sites).toHaveLength(1);
      expect(sites[0].name).toBe('My Awesome Blog');
    });

    it('should use site name as default archive title', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      nameInput.value = 'My Blog';

      const form = container.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 10));

      const sites = await listSites();
      expect(sites[0].archiveTitle).toBe('My Blog');
    });

    it('should re-render with edit form after site creation', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      nameInput.value = 'My Blog';

      const form = container.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should now show edit form
      expect(container.textContent).toContain('Blog Settings');
    });
  });

  describe('when site exists', () => {
    let existingSite;

    beforeEach(async () => {
      existingSite = await createSite({
        name: 'Test Blog',
        archiveTitle: 'Welcome to Test Blog',
        archiveTemplate: 'simple-list',
        archiveTheme: 'minimal',
      });
    });

    it('should show edit form', async () => {
      await renderSiteSettings(container);

      expect(container.textContent).toContain('Blog Settings');
    });

    it('should display current site name', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      expect(nameInput.value).toBe('Test Blog');
    });

    it('should display current archive title', async () => {
      await renderSiteSettings(container);

      const titleInput = container.querySelector('#archive-title');
      expect(titleInput.value).toBe('Welcome to Test Blog');
    });

    it('should display current archive template', async () => {
      await renderSiteSettings(container);

      const templateSelect = container.querySelector('#archive-template');
      expect(templateSelect.value).toBe('simple-list');
    });

    it('should display current archive theme', async () => {
      await renderSiteSettings(container);

      const themeSelect = container.querySelector('#archive-theme');
      expect(themeSelect.value).toBe('minimal');
    });

    it('should have template options', async () => {
      await renderSiteSettings(container);

      const templateSelect = container.querySelector('#archive-template');
      const options = Array.from(templateSelect.options).map(opt => opt.value);

      expect(options).toContain('simple-list');
      expect(options).toContain('list-with-excerpts');
    });

    it('should have theme options', async () => {
      await renderSiteSettings(container);

      const themeSelect = container.querySelector('#archive-theme');
      const options = Array.from(themeSelect.options).map(opt => opt.value);

      expect(options).toContain('minimal');
      expect(options).toContain('modern');
    });

    it('should update site name when changed', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      nameInput.value = 'New Blog Name';
      nameInput.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedSite = await getSite(existingSite.id);
      expect(updatedSite.name).toBe('New Blog Name');
    });

    it('should update archive title when changed', async () => {
      await renderSiteSettings(container);

      const titleInput = container.querySelector('#archive-title');
      titleInput.value = 'New Archive Title';
      titleInput.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedSite = await getSite(existingSite.id);
      expect(updatedSite.archiveTitle).toBe('New Archive Title');
    });

    it('should update archive template when changed', async () => {
      await renderSiteSettings(container);

      const templateSelect = container.querySelector('#archive-template');
      templateSelect.value = 'list-with-excerpts';
      templateSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedSite = await getSite(existingSite.id);
      expect(updatedSite.archiveTemplate).toBe('list-with-excerpts');
    });

    it('should update archive theme when changed', async () => {
      await renderSiteSettings(container);

      const themeSelect = container.querySelector('#archive-theme');
      themeSelect.value = 'modern';
      themeSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedSite = await getSite(existingSite.id);
      expect(updatedSite.archiveTheme).toBe('modern');
    });

    it('should show save confirmation after changes', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      nameInput.value = 'Updated Name';
      nameInput.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.textContent).toContain('Saved');
    });
  });

  describe('integration with settings page', () => {
    it('should render as a section within settings', async () => {
      await renderSiteSettings(container);

      const section = container.querySelector('.settings-section');
      expect(section).toBeTruthy();
    });

    it('should have descriptive help text for template options', async () => {
      const site = await createSite({ name: 'Test' });
      await renderSiteSettings(container);

      expect(container.textContent).toContain('Simple List');
      expect(container.textContent).toContain('List with Excerpts');
    });
  });

  describe('validation', () => {
    it('should require site name when creating', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      expect(nameInput.hasAttribute('required')).toBe(true);
    });

    it('should not create site with empty name', async () => {
      await renderSiteSettings(container);

      const nameInput = container.querySelector('#site-name');
      nameInput.value = '';

      const form = container.querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      const sites = await listSites();
      expect(sites).toHaveLength(0);
    });
  });
});
