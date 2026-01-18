/**
 * Site Bundler - Create ZIP export for entire site with multiple posts
 *
 * Generates a complete static site:
 * - index.html (archive page)
 * - {slug}/index.html (each post)
 * - images/ (consolidated images from all posts)
 * - css/ (archive and post theme CSS)
 */

import JSZip from 'jszip';
import { getSite, getPostsBySite } from '../core/storage.js';
import { getImagesByPost } from '../core/image-storage.js';
import { optimizeImage } from '../utils/image-optimizer.js';
import { renderBlocksToHTML } from './html-generator.js';
import { generateArchiveHTML } from './archive-generator.js';
import { generateRSSFeed } from './rss-generator.js';

// Import CSS files as raw strings using Vite's ?raw suffix
// Post CSS
import baseCSS from '../themes/base.css?raw';
import minimalCSS from '../themes/minimal.css?raw';
import modernCSS from '../themes/modern.css?raw';

// Archive CSS
import archiveBaseCSS from '../themes/archive-base.css?raw';
import archiveMinimalCSS from '../themes/archive-minimal.css?raw';
import archiveModernCSS from '../themes/archive-modern.css?raw';

// Theme CSS maps
const POST_THEME_CSS = {
  minimal: minimalCSS,
  modern: modernCSS,
};

const ARCHIVE_THEME_CSS = {
  minimal: archiveMinimalCSS,
  modern: archiveModernCSS,
};

const DEFAULT_THEME = 'minimal';

/**
 * Create a complete site bundle as a ZIP file
 * @param {string} siteId - ID of the site to export
 * @param {Object} [options] - Export options
 * @param {number} [options.imageMaxWidth=2000] - Max image width
 * @param {number} [options.imageMaxHeight=2000] - Max image height
 * @param {number} [options.imageQuality=0.85] - Image quality (0-1)
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createSiteBundle(siteId, options = {}) {
  const {
    imageMaxWidth = 2000,
    imageMaxHeight = 2000,
    imageQuality = 0.85,
  } = options;

  // Get site from database
  const site = await getSite(siteId);
  if (!site) {
    throw new Error('Site not found');
  }

  // Get published posts for the site
  const posts = await getPostsBySite(siteId, { status: 'published' });

  // Create ZIP
  const zip = new JSZip();

  // Collect all images and used themes
  const allImages = new Map(); // imageId -> image object
  const usedThemes = new Set();

  // Process each post
  for (const post of posts) {
    // Track theme used
    const postTheme = post.theme || DEFAULT_THEME;
    usedThemes.add(postTheme);

    // Get images for this post
    const postImages = await getImagesByPost(post.id);
    for (const image of postImages) {
      allImages.set(image.id, image);
    }

    // Generate post HTML
    const postHTML = generatePostHTML(post, postTheme);
    zip.file(`${post.slug}/index.html`, postHTML);
  }

  // Generate archive page
  const archiveHTML = generateArchiveHTML(posts, {
    archiveTitle: site.archiveTitle,
    archiveTemplate: site.archiveTemplate,
    archiveTheme: site.archiveTheme,
  });
  zip.file('index.html', archiveHTML);

  // Generate RSS feed (only if site has been deployed and has a URL)
  if (site.siteUrl) {
    const rssFeed = generateRSSFeed(posts, {
      siteUrl: site.siteUrl,
      name: site.name,
      blogDescription: site.blogDescription || '',
      feedAuthor: site.feedAuthor || null,
      feedLanguage: site.feedLanguage || 'en-us',
      feedIncludeFullContent: site.feedIncludeFullContent || false,
    });
    zip.file('feed.xml', rssFeed);
  }

  // Add archive CSS (combined base + theme)
  const archiveTheme = site.archiveTheme || DEFAULT_THEME;
  const archiveCSS = combineArchiveCSS(archiveTheme);
  zip.file('css/archive.css', archiveCSS);

  // Add post base CSS
  zip.file('css/post-base.css', baseCSS);

  // Add CSS for each used theme
  for (const themeName of usedThemes) {
    const themeCSS = POST_THEME_CSS[themeName] || POST_THEME_CSS[DEFAULT_THEME];
    zip.file(`css/post-${themeName}.css`, themeCSS);
  }

  // Add optimized images
  for (const image of allImages.values()) {
    const optimizedBlob = await optimizeImage(image.file, {
      maxWidth: imageMaxWidth,
      maxHeight: imageMaxHeight,
      quality: imageQuality,
      format: 'webp',
    });

    // Convert filename to WebP
    const webpFilename = image.filename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    zip.file(`images/${webpFilename}`, optimizedBlob);
  }

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
  });

  return zipBlob;
}

/**
 * Generate HTML document for a single post (in site context)
 * @param {Object} post - Post object
 * @param {string} themeName - Theme to use for this post
 * @returns {string} Complete HTML document
 */
function generatePostHTML(post, themeName) {
  const title = escapeHTML(post.title || 'Untitled');
  const blocks = post.content?.blocks || [];

  // Render blocks with image paths relative to post directory
  const contentHTML = renderBlocksToHTML(blocks, {
    imagePathPrefix: '../images/',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="../css/post-base.css">
  <link rel="stylesheet" href="../css/post-${themeName}.css">
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="../feed.xml">
</head>
<body>
  <article class="post-content">
    <h1>${title}</h1>
    ${contentHTML}
  </article>
</body>
</html>`;
}

/**
 * Combine archive base CSS with theme CSS
 * @param {string} themeName - Theme name
 * @returns {string} Combined CSS
 */
function combineArchiveCSS(themeName) {
  const themeCSS = ARCHIVE_THEME_CSS[themeName] || ARCHIVE_THEME_CSS[DEFAULT_THEME];
  return `${archiveBaseCSS}\n\n/* Theme: ${themeName} */\n${themeCSS}`;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
