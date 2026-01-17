import { getPost, updatePost } from '../core/storage.js';
import { loadTheme, getDefaultTheme } from '../core/theme-engine.js';

// Available themes
const THEMES = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'modern', label: 'Modern' },
];

// Store current state for updates
let currentState = {
  container: null,
  postId: null,
  onChange: null,
};

/**
 * Render the post theme selector
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} [options] - Configuration options
 * @param {string} [options.postId] - Current post ID
 * @param {Function} [options.onChange] - Callback when theme changes
 */
export async function renderPostThemeSelector(container, options = {}) {
  const { postId = null, onChange = null } = options;

  // Store state for updates
  currentState = { container, postId, onChange };

  // Clear container
  container.innerHTML = '';

  // Determine current theme
  let currentTheme;
  let isDisabled = true;

  if (postId) {
    const post = await getPost(postId);
    if (post) {
      // Handle posts with no theme, 'default', or invalid theme
      if (!post.theme || post.theme === 'default' || !THEMES.find(t => t.value === post.theme)) {
        currentTheme = await getDefaultTheme();
      } else {
        currentTheme = post.theme;
      }
      isDisabled = false;
    } else {
      currentTheme = await getDefaultTheme();
    }
  } else {
    currentTheme = await getDefaultTheme();
  }

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'post-theme-selector';

  // Create label
  const label = document.createElement('label');
  label.setAttribute('for', 'post-theme-select');
  label.textContent = 'Theme';
  wrapper.appendChild(label);

  // Create select
  const select = document.createElement('select');
  select.id = 'post-theme-select';
  select.disabled = isDisabled;

  // Add options
  for (const theme of THEMES) {
    const option = document.createElement('option');
    option.value = theme.value;
    option.textContent = theme.label;
    if (theme.value === currentTheme) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  // Handle change
  select.addEventListener('change', async (e) => {
    const newTheme = e.target.value;

    if (currentState.postId) {
      // Update post
      await updatePost(currentState.postId, { theme: newTheme });

      // Apply theme visually
      await loadTheme(newTheme);

      // Call onChange callback
      if (currentState.onChange) {
        currentState.onChange(newTheme);
      }
    }
  });

  wrapper.appendChild(select);
  container.appendChild(wrapper);
}

/**
 * Update the theme selector when post changes
 * @param {HTMLElement} container - Container element
 * @param {Object} [options] - Configuration options
 * @param {string} [options.postId] - New post ID (or null to clear)
 */
export async function updatePostThemeSelector(container, options = {}) {
  const { postId = null } = options;

  // Update stored state
  currentState.postId = postId;

  const select = container.querySelector('select');
  if (!select) return;

  if (postId) {
    const post = await getPost(postId);
    if (post) {
      // Handle posts with no theme, 'default', or invalid theme
      let theme;
      if (!post.theme || post.theme === 'default' || !THEMES.find(t => t.value === post.theme)) {
        theme = await getDefaultTheme();
      } else {
        theme = post.theme;
      }
      select.value = theme;
      select.disabled = false;

      // Apply theme visually
      await loadTheme(theme);
    }
  } else {
    // No post - disable and reset to default
    const defaultTheme = await getDefaultTheme();
    select.value = defaultTheme;
    select.disabled = true;
  }
}
