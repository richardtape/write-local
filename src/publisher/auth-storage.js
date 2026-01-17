import { db } from '../core/storage.js';

/**
 * Get the settings key for a platform's token
 * @param {string} platform - Platform name (e.g., 'netlify', 'vercel')
 * @returns {string} Settings key
 */
function getTokenKey(platform) {
  return `${platform}Token`;
}

/**
 * Save an authentication token for a platform
 * @param {string} platform - Platform name (e.g., 'netlify')
 * @param {Object} tokenData - Token data to store
 * @param {string} tokenData.accessToken - The access token
 * @param {number} [tokenData.createdAt] - When the token was created
 */
export async function saveToken(platform, tokenData) {
  const key = getTokenKey(platform);
  await db.settings.put({
    key,
    value: {
      ...tokenData,
      createdAt: tokenData.createdAt || Date.now(),
    },
  });
}

/**
 * Get the stored token for a platform
 * @param {string} platform - Platform name (e.g., 'netlify')
 * @returns {Promise<Object|null>} Token data or null if not found
 */
export async function getToken(platform) {
  const key = getTokenKey(platform);
  const stored = await db.settings.get(key);
  return stored ? stored.value : null;
}

/**
 * Delete the stored token for a platform
 * @param {string} platform - Platform name (e.g., 'netlify')
 */
export async function deleteToken(platform) {
  const key = getTokenKey(platform);
  await db.settings.delete(key);
}

/**
 * Check if a token exists for a platform
 * @param {string} platform - Platform name (e.g., 'netlify')
 * @returns {Promise<boolean>} True if token exists
 */
export async function hasToken(platform) {
  const token = await getToken(platform);
  return token !== null;
}
