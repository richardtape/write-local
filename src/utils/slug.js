/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert
 * @returns {string} URL-friendly slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()                  // Convert to lowercase
    .replace(/[^\w\s-]/g, '')      // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .trim();                        // Remove leading/trailing whitespace
}
