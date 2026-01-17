/**
 * Publish View Component
 *
 * Renders the publish UI in the sidebar, allowing users to:
 * - Connect to Netlify via OAuth
 * - Select an existing site or create new
 * - Publish their post with progress feedback
 */

import { hasToken, saveToken, deleteToken, getToken } from '../publisher/auth-storage.js';
import { generateAuthUrl, openAuthPopup } from '../publisher/netlify-oauth.js';
import { listSites } from '../publisher/netlify-api.js';
import { publishToNetlify } from '../publisher/deploy-service.js';
import { setStatus } from '../core/storage.js';

/**
 * UI States
 */
const STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  PUBLISHING: 'publishing',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Render the publish view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Configuration options
 * @param {Router} options.router - Router instance for navigation
 * @param {string} options.postId - ID of the post to publish
 */
export async function renderPublishView(container, options = {}) {
  const { router, postId } = options;

  // Clear container
  container.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'publish-header';
  header.innerHTML = `
    <button class="btn-back" data-action="back">← Back</button>
    <h2>Publish</h2>
  `;
  container.appendChild(header);

  // Add back button handler
  if (router) {
    header.querySelector('[data-action="back"]').addEventListener('click', () => {
      router.navigate('/posts');
    });
  }

  // Check if post is selected
  if (!postId) {
    const noPost = document.createElement('div');
    noPost.className = 'publish-no-post';
    noPost.innerHTML = `
      <p>No post selected. Please select a post to publish.</p>
    `;
    container.appendChild(noPost);
    return;
  }

  // Create content area
  const content = document.createElement('div');
  content.className = 'publish-content';
  container.appendChild(content);

  // Determine initial state based on authentication
  const isConnected = await hasToken('netlify');

  if (isConnected) {
    await renderConnectedState(content, { postId, router });
  } else {
    renderDisconnectedState(content, { postId, router, container });
  }
}

/**
 * Render disconnected state - show connect button
 */
function renderDisconnectedState(content, { postId, router, container }) {
  content.innerHTML = `
    <div class="publish-connect" data-state="disconnected">
      <p>Connect your Netlify account to publish your blog directly to the web.</p>
      <button class="btn-connect-netlify" data-action="connect-netlify">
        Connect to Netlify
      </button>
      <p class="publish-help">
        Free hosting with automatic HTTPS. Your blog will be live in seconds.
      </p>
    </div>
  `;

  // Add connect handler
  const connectBtn = content.querySelector('[data-action="connect-netlify"]');
  connectBtn.addEventListener('click', () => {
    startOAuthFlow({ postId, router, container });
  });
}

/**
 * Render connected state - show publish options
 */
async function renderConnectedState(content, { postId, router }) {
  // Show loading while fetching sites
  content.innerHTML = `
    <div class="publish-loading">
      <p>Loading your Netlify sites...</p>
    </div>
  `;

  // Fetch user's sites
  let sites = [];
  try {
    const tokenData = await getToken('netlify');
    sites = await listSites(tokenData.accessToken);
  } catch (error) {
    console.error('Failed to load sites:', error);
    // Continue with empty sites list
  }

  content.innerHTML = `
    <div class="publish-options" data-state="connected">
      <div class="netlify-connected">
        <span class="connected-badge">✓ Connected to Netlify</span>
        <button class="btn-disconnect" data-action="disconnect">Disconnect</button>
      </div>

      <div class="site-selection">
        <label for="netlify-site-select">Deploy to:</label>
        <select id="netlify-site-select">
          <option value="new">Create new site</option>
          ${sites.map(site => `
            <option value="${site.id}">${site.name}</option>
          `).join('')}
        </select>
      </div>

      <button class="btn-publish" data-action="publish">
        Publish to Netlify
      </button>
    </div>
  `;

  // Add disconnect handler
  const disconnectBtn = content.querySelector('[data-action="disconnect"]');
  disconnectBtn.addEventListener('click', async () => {
    await deleteToken('netlify');
    // Re-render as disconnected
    const container = content.closest('.publish-content')?.parentElement;
    if (container) {
      await renderPublishView(container, { router, postId });
    }
  });

  // Add publish handler
  const publishBtn = content.querySelector('[data-action="publish"]');
  publishBtn.addEventListener('click', async () => {
    const siteSelect = content.querySelector('#netlify-site-select');
    const selectedSiteId = siteSelect.value === 'new' ? null : siteSelect.value;

    await startPublishing(content, { postId, siteId: selectedSiteId });
  });
}

/**
 * Start the OAuth flow
 */
function startOAuthFlow({ postId, router, container }) {
  const authUrl = generateAuthUrl();
  const popup = openAuthPopup(authUrl);

  if (!popup) {
    alert('Popup blocked. Please allow popups for this site and try again.');
    return;
  }

  // Listen for message from popup
  const messageHandler = async (event) => {
    // Verify origin for security
    if (event.origin !== window.location.origin) return;

    // Check if this is our OAuth callback
    if (event.data?.type === 'oauth-callback' && event.data?.platform === 'netlify') {
      // Remove listener
      window.removeEventListener('message', messageHandler);

      if (event.data.success) {
        await saveToken('netlify', {
          accessToken: event.data.accessToken,
          createdAt: Date.now(),
        });
        // Re-render as connected
        if (container) {
          await renderPublishView(container, { router, postId });
        }
      } else {
        alert(`Authentication failed: ${event.data.error}`);
      }
    }
  };

  window.addEventListener('message', messageHandler);

  // Also poll for popup close (in case user closes it manually)
  const pollTimer = setInterval(() => {
    if (popup.closed) {
      clearInterval(pollTimer);
      // Give a moment for any pending message to arrive
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
      }, 1000);
    }
  }, 500);
}

/**
 * Start the publishing process
 */
async function startPublishing(content, { postId, siteId }) {
  // Show publishing state
  content.innerHTML = `
    <div class="publish-progress" data-state="publishing">
      <div class="progress-spinner"></div>
      <p class="progress-status">Generating export bundle...</p>
    </div>
  `;

  const statusEl = content.querySelector('.progress-status');

  try {
    const result = await publishToNetlify(postId, {
      siteId,
      onProgress: ({ message }) => {
        statusEl.textContent = message;
      },
    });

    // Mark post as published
    await setStatus(postId, 'published');

    // Show success state
    content.innerHTML = `
      <div class="publish-success" data-state="success">
        <div class="success-icon">✓</div>
        <h3>Published successfully!</h3>
        <p>Your blog is now live at:</p>
        <a href="${result.url}" target="_blank" class="site-url">${result.url}</a>
        <button class="btn-view-site" onclick="window.open('${result.url}', '_blank')">
          View Site
        </button>
      </div>
    `;
  } catch (error) {
    // Show error state
    content.innerHTML = `
      <div class="publish-error" data-state="error">
        <div class="error-icon">✕</div>
        <h3>Publishing failed</h3>
        <p class="error-message">${escapeHTML(error.message)}</p>
        <button class="btn-retry" data-action="retry">Try Again</button>
      </div>
    `;

    // Add retry handler
    const retryBtn = content.querySelector('[data-action="retry"]');
    retryBtn.addEventListener('click', () => {
      startPublishing(content, { postId, siteId });
    });
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
