import { generateExcerpt } from './excerpt-generator.js';

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format a timestamp for display in archive
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.iso=false] - Return ISO date format (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
export function formatArchiveDate(timestamp, options = {}) {
  const date = new Date(timestamp);

  if (options.iso) {
    // Return ISO format for datetime attribute
    return date.toISOString().split('T')[0];
  }

  // Return human-readable format: "January 15, 2026"
  // Use UTC to match the ISO date and avoid timezone issues
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Generate a single post item HTML
 * @param {Object} post - Post object
 * @param {boolean} includeExcerpt - Whether to include excerpt
 * @returns {string} HTML for the post item
 */
function generatePostItem(post, includeExcerpt) {
  const title = escapeHTML(post.title);
  const slug = post.slug;
  const timestamp = post.publishedAt || post.updatedAt || Date.now();
  const displayDate = formatArchiveDate(timestamp);
  const isoDate = formatArchiveDate(timestamp, { iso: true });

  let excerptHTML = '';
  if (includeExcerpt) {
    const blocks = post.content?.blocks || [];
    const excerpt = generateExcerpt(blocks);
    if (excerpt) {
      excerptHTML = `
      <p class="post-excerpt">${escapeHTML(excerpt)}</p>`;
    }
  }

  return `    <li class="post-item">
      <a href="./${slug}/" class="post-link">${title}</a>
      <time class="post-date" datetime="${isoDate}">${displayDate}</time>${excerptHTML}
    </li>`;
}

/**
 * Generate the complete archive page HTML
 * @param {Array} posts - Array of post objects
 * @param {Object} siteConfig - Site configuration
 * @param {string} siteConfig.archiveTitle - Title for the archive page
 * @param {string} siteConfig.archiveTemplate - Template: 'simple-list' or 'list-with-excerpts'
 * @param {string} siteConfig.archiveTheme - Theme ID for styling
 * @returns {string} Complete HTML document
 */
export function generateArchiveHTML(posts, siteConfig) {
  const {
    archiveTitle,
    archiveTemplate = 'simple-list',
  } = siteConfig;

  const escapedTitle = escapeHTML(archiveTitle);
  const includeExcerpts = archiveTemplate === 'list-with-excerpts';

  // Sort posts by publishedAt descending (newest first)
  const sortedPosts = [...posts].sort((a, b) => {
    const aTime = a.publishedAt || a.updatedAt || 0;
    const bTime = b.publishedAt || b.updatedAt || 0;
    return bTime - aTime;
  });

  // Generate post list items
  const postItems = sortedPosts
    .map(post => generatePostItem(post, includeExcerpts))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="stylesheet" href="./css/archive.css">
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="./feed.xml">
</head>
<body>
  <article class="archive-content">
    <h1 class="archive-title">${escapedTitle}</h1>
    <ul class="post-list">
${postItems}
    </ul>
  </article>
</body>
</html>`;
}
