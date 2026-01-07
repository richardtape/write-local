import Dexie from 'dexie';
import { nanoid } from 'nanoid';
import { generateSlug } from '../utils/slug.js';

// Initialize Dexie database
export const db = new Dexie('WriteLocal');

// Define database schema
db.version(1).stores({
  posts: 'id, slug, status, updatedAt, [status+updatedAt]',
  images: 'id, postId',
  themes: 'id, isDefault',
  settings: 'key',
});

/**
 * Create a new post
 * @param {Object} data - Post data
 * @param {string} data.title - Post title
 * @param {Array} data.content - EditorJS content blocks
 * @param {string} [data.theme] - Theme ID (optional)
 * @returns {Promise<Object>} Created post
 */
export async function createPost({ title, content, theme = 'default' }) {
  const now = Date.now();

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
