import { createSite, updateSite, listSites } from '../core/storage.js';

/**
 * Render site settings component
 * Shows create form if no site exists, edit form if site exists
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} [options] - Configuration options
 */
export async function renderSiteSettings(container, options = {}) {
  // Get existing site (we only support one site for now)
  const sites = await listSites();
  const site = sites.length > 0 ? sites[0] : null;

  // Clear container
  container.innerHTML = '';

  if (site) {
    renderEditForm(container, site);
  } else {
    renderCreateForm(container);
  }
}

/**
 * Render the create site form
 * @param {HTMLElement} container - Container element
 */
function renderCreateForm(container) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  section.innerHTML = `
    <h3>Create Your Blog</h3>
    <form id="create-site-form">
      <div class="settings-item">
        <label for="site-name">Blog Name</label>
        <input type="text" id="site-name" required placeholder="My Awesome Blog">
        <p class="settings-help">
          This name will be used as the title of your blog's archive page.
        </p>
      </div>
      <div class="settings-item">
        <button type="submit" class="btn-primary">Create Blog</button>
      </div>
    </form>
  `;
  container.appendChild(section);

  // Handle form submission
  const form = section.querySelector('#create-site-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = form.querySelector('#site-name');
    const name = nameInput.value.trim();

    if (!name) {
      return;
    }

    // Create the site
    await createSite({
      name,
      archiveTitle: name, // Default archive title to site name
      archiveTemplate: 'simple-list',
      archiveTheme: 'minimal',
    });

    // Re-render with edit form
    await renderSiteSettings(container);
  });
}

/**
 * Render the edit site form
 * @param {HTMLElement} container - Container element
 * @param {Object} site - Existing site object
 */
function renderEditForm(container, site) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  section.innerHTML = `
    <h3>Blog Settings</h3>
    <div class="settings-item">
      <label for="site-name">Blog Name</label>
      <input type="text" id="site-name" value="${escapeAttribute(site.name)}" required>
      <p class="settings-help">
        Internal name for your blog.
      </p>
    </div>
    <div class="settings-item">
      <label for="archive-title">Archive Page Title</label>
      <input type="text" id="archive-title" value="${escapeAttribute(site.archiveTitle)}">
      <p class="settings-help">
        The heading displayed on your blog's main page.
      </p>
    </div>
    <div class="settings-item">
      <label for="archive-template">Archive Template</label>
      <select id="archive-template">
        <option value="simple-list" ${site.archiveTemplate === 'simple-list' ? 'selected' : ''}>
          Simple List - Post titles and dates
        </option>
        <option value="list-with-excerpts" ${site.archiveTemplate === 'list-with-excerpts' ? 'selected' : ''}>
          List with Excerpts - Titles, dates, and preview text
        </option>
      </select>
      <p class="settings-help">
        Choose how posts are displayed on your archive page.
      </p>
    </div>
    <div class="settings-item">
      <label for="archive-theme">Archive Theme</label>
      <select id="archive-theme">
        <option value="minimal" ${site.archiveTheme === 'minimal' ? 'selected' : ''}>Minimal</option>
        <option value="modern" ${site.archiveTheme === 'modern' ? 'selected' : ''}>Modern</option>
      </select>
      <p class="settings-help">
        Visual style for your archive page.
      </p>
    </div>
    <div class="save-status" id="save-status"></div>
  `;
  container.appendChild(section);

  // Set up change handlers for all fields
  const nameInput = section.querySelector('#site-name');
  const titleInput = section.querySelector('#archive-title');
  const templateSelect = section.querySelector('#archive-template');
  const themeSelect = section.querySelector('#archive-theme');
  const saveStatus = section.querySelector('#save-status');

  const handleChange = async (field, value) => {
    await updateSite(site.id, { [field]: value });
    showSaveStatus(saveStatus);
  };

  nameInput.addEventListener('change', (e) => handleChange('name', e.target.value));
  titleInput.addEventListener('change', (e) => handleChange('archiveTitle', e.target.value));
  templateSelect.addEventListener('change', (e) => handleChange('archiveTemplate', e.target.value));
  themeSelect.addEventListener('change', (e) => handleChange('archiveTheme', e.target.value));
}

/**
 * Show save confirmation
 * @param {HTMLElement} statusElement - Element to show status in
 */
function showSaveStatus(statusElement) {
  statusElement.textContent = 'Saved';
  statusElement.classList.add('visible');

  // Hide after 2 seconds
  setTimeout(() => {
    statusElement.classList.remove('visible');
  }, 2000);
}

/**
 * Escape string for use in HTML attribute
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeAttribute(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
