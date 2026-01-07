import { nanoid } from 'nanoid';
import { db } from './storage.js';

/**
 * Save an image to IndexedDB
 * @param {string} postId - ID of the post this image belongs to
 * @param {Blob} file - Image file as Blob
 * @param {Object} options - Image metadata
 * @param {string} options.filename - Original filename
 * @param {string} [options.caption] - Image caption
 * @param {string} [options.alt] - Alt text for accessibility
 * @param {number} [options.width] - Image width in pixels
 * @param {number} [options.height] - Image height in pixels
 * @returns {Promise<Object>} Saved image record
 */
export async function saveImage(postId, file, options = {}) {
  const {
    filename = 'untitled.png',
    caption = '',
    alt = '',
    width = 0,
    height = 0,
  } = options;

  const image = {
    id: nanoid(),
    postId,
    file, // Store Blob directly
    filename,
    type: file.type,
    size: file.size,
    width,
    height,
    caption,
    alt,
    createdAt: Date.now(),
  };

  await db.images.add(image);
  return image;
}

/**
 * Get an image by ID
 * @param {string} imageId - Image ID
 * @returns {Promise<Object|undefined>} Image record or undefined if not found
 */
export async function getImage(imageId) {
  return await db.images.get(imageId);
}

/**
 * Get all images for a specific post
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} Array of image records, sorted by createdAt (oldest first)
 */
export async function getImagesByPost(postId) {
  const images = await db.images.where('postId').equals(postId).toArray();

  // Sort by createdAt ascending (oldest first - insertion order)
  return images.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Update image metadata (alt text, caption, etc.)
 * @param {string} imageId - Image ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.alt] - Alt text
 * @param {string} [updates.caption] - Caption
 * @returns {Promise<void>}
 */
export async function updateImage(imageId, updates) {
  const image = await db.images.get(imageId);

  if (!image) {
    return; // Silently skip if image doesn't exist
  }

  await db.images.update(imageId, updates);
}

/**
 * Delete an image by ID
 * @param {string} imageId - Image ID
 * @returns {Promise<void>}
 */
export async function deleteImage(imageId) {
  await db.images.delete(imageId);
}
