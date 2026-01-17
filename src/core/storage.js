import Dexie from 'dexie';
import { nanoid } from 'nanoid';
import { generateSlug } from '../utils/slug.js';

// Initialize Dexie database
export const db = new Dexie('WriteLocal');

// Define database schema
// Version 1: Original schema
db.version(1).stores({
  posts: 'id, slug, status, updatedAt, [status+updatedAt]',
  images: 'id, postId',
  themes: 'id, isDefault',
  settings: 'key',
});

// Version 2: Add sites table and siteId index on posts
db.version(2).stores({
  posts: 'id, slug, status, updatedAt, siteId, [status+updatedAt], [siteId+status]',
  images: 'id, postId',
  themes: 'id, isDefault',
  settings: 'key',
  sites: 'id, platform, updatedAt',
});

/**
 * Create a new post
 * @param {Object} data - Post data
 * @param {string} data.title - Post title
 * @param {Array} data.content - EditorJS content blocks
 * @param {string} [data.theme] - Theme ID (optional, defaults to user's default theme)
 * @returns {Promise<Object>} Created post
 */
export async function createPost({ title, content, theme }) {
  const now = Date.now();

  // If no theme specified, use the default theme from settings
  if (!theme) {
    const defaultThemeSetting = await db.settings.get('defaultTheme');
    theme = defaultThemeSetting?.value || 'minimal'; // Fallback to 'minimal' if not set
  }

  const post = {
    id: nanoid(),
    title,
    slug: generateSlug(title),
    content,
    theme,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  await db.posts.add(post);
  return post;
}

/**
 * Get a post by ID
 * @param {string} id - Post ID
 * @returns {Promise<Object|undefined>} Post or undefined if not found
 */
export async function getPost(id) {
  return await db.posts.get(id);
}

/**
 * Update a post
 * @param {string} id - Post ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.title] - New title
 * @param {Array} [updates.content] - New content
 * @param {string} [updates.theme] - New theme
 * @param {string} [updates.status] - New status
 * @returns {Promise<Object>} Updated post
 */
export async function updatePost(id, updates) {
  // Get existing post
  const existing = await db.posts.get(id);
  if (!existing) {
    throw new Error(`Post with id ${id} not found`);
  }

  // Build updated post object
  const updatedPost = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  // Regenerate slug if title changed
  if (updates.title && updates.title !== existing.title) {
    updatedPost.slug = generateSlug(updates.title);
  }

  // Save to database
  await db.posts.put(updatedPost);

  return updatedPost;
}

/**
 * List posts with optional filtering
 * @param {Object} [options] - Filter options
 * @param {string} [options.status] - Filter by status (draft/published/trashed/pending)
 * @returns {Promise<Array>} Array of posts, sorted by updatedAt descending
 */
export async function listPosts(options = {}) {
  let posts;

  // Filter by status if provided
  if (options.status) {
    posts = await db.posts.where('status').equals(options.status).toArray();
  } else {
    // Default: exclude trashed posts
    posts = await db.posts.where('status').notEqual('trashed').toArray();
  }

  // Sort by updatedAt descending (most recent first)
  return posts.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Delete a post
 * @param {string} id - Post ID
 * @param {Object} [options] - Delete options
 * @param {boolean} [options.permanent=false] - Permanently delete (true) or move to trash (false)
 * @returns {Promise<void>}
 */
export async function deletePost(id, options = {}) {
  const { permanent = false } = options;

  if (permanent) {
    // Permanently delete from database
    await db.posts.delete(id);
  } else {
    // Soft delete: move to trash
    await updatePost(id, { status: 'trashed' });
  }
}

/**
 * Set post status with proper publishedAt handling
 * @param {string} id - Post ID
 * @param {string} status - New status (draft, published, pending, trashed)
 * @returns {Promise<Object>} Updated post
 */
export async function setStatus(id, status) {
  const validStatuses = ['draft', 'published', 'pending', 'trashed'];

  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`
    );
  }

  const updates = { status };

  // Set publishedAt when publishing
  if (status === 'published') {
    updates.publishedAt = Date.now();
  } else {
    // Clear publishedAt when unpublishing (moving to any other status)
    updates.publishedAt = null;
  }

  return await updatePost(id, updates);
}

/**
 * Get the most recently updated post (excluding trashed)
 * @returns {Promise<Object|undefined>} Most recent post or undefined if none exist
 */
export async function getMostRecentPost() {
  const posts = await listPosts(); // Already excludes trashed posts and sorts by updatedAt

  if (posts.length === 0) {
    return undefined;
  }

  return posts[0]; // First post is most recent (sorted by updatedAt descending)
}

// =============================================================================
// Site Storage Functions
// =============================================================================

/**
 * Create a new site
 * @param {Object} data - Site data
 * @param {string} data.name - Site name (internal identifier)
 * @param {string} [data.archiveTitle] - Archive page title (defaults to name)
 * @param {string} [data.archiveTemplate='simple-list'] - Archive template
 * @param {string} [data.archiveTheme='minimal'] - Archive theme
 * @returns {Promise<Object>} Created site
 */
export async function createSite({
  name,
  archiveTitle,
  archiveTemplate = 'simple-list',
  archiveTheme = 'minimal',
}) {
  const now = Date.now();

  const site = {
    id: nanoid(),
    name,
    // Archive configuration (platform-agnostic)
    archiveTitle: archiveTitle || name, // Default to site name
    archiveTemplate,
    archiveTheme,
    // Platform deployment fields (null until deployed)
    platform: null,
    platformSiteId: null,
    platformUrl: null,
    // Timestamps
    createdAt: now,
    updatedAt: now,
    lastPublishedAt: null,
  };

  await db.sites.add(site);
  return site;
}

/**
 * Get a site by ID
 * @param {string} id - Site ID
 * @returns {Promise<Object|undefined>} Site or undefined if not found
 */
export async function getSite(id) {
  return await db.sites.get(id);
}

/**
 * Update a site
 * @param {string} id - Site ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated site
 */
export async function updateSite(id, updates) {
  const existing = await db.sites.get(id);
  if (!existing) {
    throw new Error(`Site with id ${id} not found`);
  }

  const updatedSite = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  await db.sites.put(updatedSite);
  return updatedSite;
}

/**
 * Delete a site
 * @param {string} id - Site ID
 * @returns {Promise<void>}
 */
export async function deleteSite(id) {
  await db.sites.delete(id);
}

/**
 * List all sites
 * @returns {Promise<Array>} Array of sites, sorted by updatedAt descending
 */
export async function listSites() {
  const sites = await db.sites.toArray();
  return sites.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get posts belonging to a site
 * @param {string} siteId - Site ID
 * @param {Object} [options] - Filter options
 * @param {string} [options.status] - Filter by status (e.g., 'published')
 * @returns {Promise<Array>} Array of posts belonging to the site
 */
export async function getPostsBySite(siteId, options = {}) {
  let posts;

  if (options.status) {
    // Use compound index for efficient query
    posts = await db.posts
      .where('[siteId+status]')
      .equals([siteId, options.status])
      .toArray();
  } else {
    // Get all posts for site, excluding trashed
    posts = await db.posts
      .where('siteId')
      .equals(siteId)
      .toArray();

    // Filter out trashed posts
    posts = posts.filter(p => p.status !== 'trashed');
  }

  // Sort by publishedAt descending (most recently published first)
  // For unpublished posts, fall back to updatedAt
  return posts.sort((a, b) => {
    const aTime = a.publishedAt || a.updatedAt;
    const bTime = b.publishedAt || b.updatedAt;
    return bTime - aTime;
  });
}
