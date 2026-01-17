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
import { publishSiteToNetlify } from '../publisher/deploy-service.js';
import { setStatus, updatePost, getPost, listSites as listLocalSites, createSite, getPostsBySite } from '../core/storage.js';

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
      <p>Checking your blog configuration...</p>
    </div>
  `;

  // Get the current post
  const post = await getPost(postId);
  if (!post) {
    content.innerHTML = `<div class="publish-error"><p>Post not found.</p></div>`;
    return;
  }

  // Check if a local site exists
  const localSites = await listLocalSites();
  const hasSite = localSites.length > 0;
  const site = hasSite ? localSites[0] : null; // For now, we only support one site

  if (!hasSite) {
    // No site exists - show create blog UI
    await renderCreateBlogUI(content, { postId, router, post });
  } else {
    // Site exists - show publish options
    await renderPublishOptions(content, { postId, router, post, site });
  }
}

/**
 * Render the "Create Blog" UI for first-time publishers
 */
async function renderCreateBlogUI(content, { postId, router, post }) {
  content.innerHTML = `
    <div class="publish-options" data-state="connected">
      <div class="netlify-connected">
        <span class="connected-badge">✓ Connected to Netlify</span>
        <button class="btn-disconnect" data-action="disconnect">Disconnect</button>
      </div>

      <h3 style="margin: 1.5rem 0 0.5rem;">Create Your Blog</h3>
      <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
        You'll be publishing "${post.title}" to a new blog site. You can configure your blog settings later.
      </p>

      <div class="site-selection">
        <label for="blog-name-input">Blog Name:</label>
        <input
          type="text"
          id="blog-name-input"
          placeholder="My Awesome Blog"
          value="My Blog"
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.875rem;"
        >
        <p style="color: #888; font-size: 0.8rem; margin-top: 0.5rem;">
          This will be the title of your blog's home page.
        </p>
      </div>

      <button class="btn-publish" data-action="publish" style="margin-top: 1rem;">
        Create Blog & Publish
      </button>
    </div>
  `;

  // Add disconnect handler
  const disconnectBtn = content.querySelector('[data-action="disconnect"]');
  disconnectBtn.addEventListener('click', async () => {
    await deleteToken('netlify');
    const container = content.closest('.publish-content')?.parentElement;
    if (container) {
      await renderPublishView(container, { router, postId });
    }
  });

  // Add publish handler
  const publishBtn = content.querySelector('[data-action="publish"]');
  publishBtn.addEventListener('click', async () => {
    const blogNameInput = content.querySelector('#blog-name-input');
    const blogName = blogNameInput.value.trim();

    if (!blogName) {
      alert('Please enter a blog name.');
      return;
    }

    await startPublishingWithNewSite(content, { postId, blogName });
  });
}

/**
 * Render publish options when site already exists
 */
async function renderPublishOptions(content, { postId, router, post, site }) {
  // Get all published posts for this site
  const publishedPosts = await getPostsBySite(site.id, { status: 'published' });

  // Check if current post is already published
  const isPostPublished = post.status === 'published' && post.siteId === site.id;
  const otherPublishedCount = isPostPublished ? publishedPosts.length - 1 : publishedPosts.length;

  const publishActionText = isPostPublished ? 'Republish' : 'Publish';
  const publishDescription = isPostPublished
    ? `Updating "${post.title}" and ${otherPublishedCount} other post${otherPublishedCount !== 1 ? 's' : ''}`
    : `Publishing "${post.title}"${otherPublishedCount > 0 ? ` with ${otherPublishedCount} other post${otherPublishedCount !== 1 ? 's' : ''}` : ''}`;

  content.innerHTML = `
    <div class="publish-options" data-state="connected">
      <div class="netlify-connected">
        <span class="connected-badge">✓ Connected to Netlify</span>
        <button class="btn-disconnect" data-action="disconnect">Disconnect</button>
      </div>

      <h3 style="margin: 1.5rem 0 0.5rem;">Publish to Your Blog</h3>

      <div style="background: #f5f5f5; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
        <div style="font-weight: 500; margin-bottom: 0.5rem;">${site.name}</div>
        ${site.platformUrl ? `<div style="font-size: 0.85rem; color: #666;">${site.platformUrl}</div>` : ''}
        ${site.lastPublishedAt ? `<div style="font-size: 0.8rem; color: #888; margin-top: 0.25rem;">Last published: ${formatDate(site.lastPublishedAt)}</div>` : ''}
      </div>

      <div style="color: #666; font-size: 0.9rem; margin: 1rem 0;">
        ${publishDescription}
      </div>

      <button class="btn-publish" data-action="publish">
        ${publishActionText} Blog
      </button>

      <p style="color: #888; font-size: 0.8rem; margin-top: 1rem;">
        Need to change blog settings? Go to <a href="#" data-action="go-settings" style="color: #0066cc; text-decoration: none;">Settings</a>
      </p>
    </div>
  `;

  // Add disconnect handler
  const disconnectBtn = content.querySelector('[data-action="disconnect"]');
  disconnectBtn.addEventListener('click', async () => {
    await deleteToken('netlify');
    const container = content.closest('.publish-content')?.parentElement;
    if (container) {
      await renderPublishView(container, { router, postId });
    }
  });

  // Add settings link handler
  const settingsLink = content.querySelector('[data-action="go-settings"]');
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate('/settings');
    });
  }

  // Add publish handler
  const publishBtn = content.querySelector('[data-action="publish"]');
  publishBtn.addEventListener('click', async () => {
    await startPublishingToSite(content, { postId, siteId: site.id });
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
 * Start publishing with a new site
 */
async function startPublishingWithNewSite(content, { postId, blogName }) {
  // Show publishing state
  content.innerHTML = `
    <div class="publish-progress" data-state="publishing">
      <div class="progress-spinner"></div>
      <p class="progress-status">Creating your blog...</p>
    </div>
  `;

  const statusEl = content.querySelector('.progress-status');

  try {
    // Step 1: Create the site in local storage
    statusEl.textContent = 'Setting up blog configuration...';
    const site = await createSite({
      name: blogName,
      archiveTitle: blogName,
      archiveTemplate: 'simple-list',
      archiveTheme: 'minimal',
    });

    // Step 2: Link post to site
    statusEl.textContent = 'Linking post to blog...';
    await updatePost(postId, { siteId: site.id });

    // Step 3: Mark post as published
    await setStatus(postId, 'published');

    // Step 4: Publish to Netlify
    const result = await publishSiteToNetlify(site.id, {
      onProgress: ({ message }) => {
        statusEl.textContent = message;
      },
    });

    // Show success state
    content.innerHTML = `
      <div class="publish-success" data-state="success">
        <div class="success-icon">✓</div>
        <h3>Blog created and published!</h3>
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
      startPublishingWithNewSite(content, { postId, blogName });
    });
  }
}

/**
 * Start publishing to an existing site
 */
async function startPublishingToSite(content, { postId, siteId }) {
  // Show publishing state
  content.innerHTML = `
    <div class="publish-progress" data-state="publishing">
      <div class="progress-spinner"></div>
      <p class="progress-status">Preparing to publish...</p>
    </div>
  `;

  const statusEl = content.querySelector('.progress-status');

  try {
    // Step 1: Link post to site (if not already)
    const post = await getPost(postId);
    if (post.siteId !== siteId) {
      statusEl.textContent = 'Linking post to blog...';
      await updatePost(postId, { siteId });
    }

    // Step 2: Mark post as published
    statusEl.textContent = 'Marking post as published...';
    await setStatus(postId, 'published');

    // Step 3: Publish entire site to Netlify
    const result = await publishSiteToNetlify(siteId, {
      onProgress: ({ message }) => {
        statusEl.textContent = message;
      },
    });

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
      startPublishingToSite(content, { postId, siteId });
    });
  }
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
