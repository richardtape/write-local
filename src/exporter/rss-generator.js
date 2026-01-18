import { generateExcerpt } from './excerpt-generator.js';
import { renderBlocksToHTML } from './html-generator.js';

/**
 * Format timestamp to RFC 822 date format (required by RSS 2.0)
 * Example: "Mon, 01 Jan 2024 10:00:00 GMT"
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} RFC 822 formatted date string
 */
export function formatRFC822Date(timestamp) {
  const date = new Date(timestamp);

  // RFC 822 format: "Day, DD Mon YYYY HH:MM:SS GMT"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getUTCDay()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
}

/**
 * Format timestamp to ISO 8601 format (for atom:updated)
 * Example: "2024-01-15T14:30:00Z"
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} ISO 8601 formatted date string
 */
function formatISO8601Date(timestamp) {
  return new Date(timestamp).toISOString();
}

/**
 * Escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for XML
 */
function escapeXML(text) {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a single RSS item element for a post
 * @param {Object} post - Post object
 * @param {Object} siteConfig - Site configuration
 * @returns {string} RSS item XML
 */
function generateRSSItem(post, siteConfig) {
  const { siteUrl, feedIncludeFullContent } = siteConfig;

  // Build post URL
  const postUrl = `${siteUrl}/${post.slug}/`;

  // GUID using post ID (stable even if slug changes)
  const guid = `urn:uuid:${post.id}`;

  // Format dates
  const pubDate = formatRFC822Date(post.publishedAt);

  // Include atom:updated only if post was modified after publishing
  const wasUpdated = post.updatedAt > post.publishedAt;
  const atomUpdated = wasUpdated
    ? `      <atom:updated>${formatISO8601Date(post.updatedAt)}</atom:updated>`
    : '';

  // Escape title
  const title = escapeXML(post.title);

  // Generate content
  const blocks = post.content?.blocks || [];
  let description = '';
  let contentEncoded = '';

  if (feedIncludeFullContent) {
    // Full content mode: include HTML in content:encoded
    const html = renderBlocksToHTML(blocks, {
      imagePathPrefix: `${siteUrl}/images/`
    });
    contentEncoded = `      <content:encoded><![CDATA[${html}]]></content:encoded>`;

    // Also include excerpt in description
    const excerpt = generateExcerpt(blocks, 50);
    description = `<![CDATA[${excerpt}]]>`;
  } else {
    // Excerpt mode: just description
    const excerpt = generateExcerpt(blocks, 50);
    description = `<![CDATA[${excerpt}]]>`;
  }

  return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
${atomUpdated}
      <description>${description}</description>
${contentEncoded}
    </item>`;
}

/**
 * Generate RSS 2.0 feed XML
 * @param {Array} posts - Array of published posts (must have publishedAt)
 * @param {Object} siteConfig - Site configuration
 * @param {string} siteConfig.siteUrl - Base URL (e.g., 'https://myblog.com')
 * @param {string} siteConfig.name - Blog name
 * @param {string} siteConfig.blogDescription - Feed description
 * @param {string} [siteConfig.feedAuthor] - Author (RFC 822 format)
 * @param {string} [siteConfig.feedLanguage='en-us'] - Language code
 * @param {boolean} [siteConfig.feedIncludeFullContent=false] - Full vs excerpt
 * @returns {string} RSS XML document
 */
export function generateRSSFeed(posts, siteConfig) {
  const {
    siteUrl,
    name,
    blogDescription = '',
    feedAuthor,
    feedLanguage = 'en-us',
    feedIncludeFullContent = false,
  } = siteConfig;

  // Sort posts by publishedAt descending (newest first)
  const sortedPosts = [...posts].sort((a, b) => b.publishedAt - a.publishedAt);

  // Get most recent post date for lastBuildDate
  const lastBuildDate = sortedPosts.length > 0
    ? formatRFC822Date(sortedPosts[0].publishedAt)
    : formatRFC822Date(Date.now());

  // Build channel metadata
  const channelTitle = escapeXML(name);
  const channelLink = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const channelDescription = escapeXML(blogDescription);
  const feedUrl = `${siteUrl}/feed.xml`;

  // Optional managingEditor
  const managingEditorElement = feedAuthor
    ? `    <managingEditor>${escapeXML(feedAuthor)}</managingEditor>`
    : '';

  // Generate items for each post
  const items = sortedPosts
    .map(post => generateRSSItem(post, siteConfig))
    .join('\n');

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${channelTitle}</title>
    <link>${channelLink}</link>
    <description>${channelDescription}</description>
    <language>${feedLanguage}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${managingEditorElement}
${items}
  </channel>
</rss>`;

  return xml;
}
