/**
 * Bundler - Create ZIP export with HTML, Markdown, images, and CSS
 *
 * This module bundles a post into a downloadable ZIP file containing:
 * - index.html (rendered HTML with theme)
 * - index.md (Markdown version)
 * - images/ (optimized WebP images)
 * - css/theme.css (combined base + theme CSS)
 */

import JSZip from 'jszip';
import { getPost } from '../core/storage.js';
import { getImagesByPost } from '../core/image-storage.js';
import { optimizeImage } from '../utils/image-optimizer.js';
import { renderBlocksToHTML } from './html-generator.js';
import { renderBlocksToMarkdown } from './markdown-generator.js';
import { getDefaultTheme } from '../core/theme-engine.js';

// Import CSS files as raw strings using Vite's ?raw suffix
import baseCSS from '../themes/base.css?raw';
import minimalCSS from '../themes/minimal.css?raw';
import modernCSS from '../themes/modern.css?raw';

// Theme CSS map
const THEME_CSS = {
  minimal: minimalCSS,
  modern: modernCSS,
};

/**
 * Create a complete export bundle as a ZIP file
 * @param {string} postId - ID of the post to export
 * @param {Object} [options] - Export options
 * @param {number} [options.imageMaxWidth=2000] - Max image width
 * @param {number} [options.imageMaxHeight=2000] - Max image height
 * @param {number} [options.imageQuality=0.85] - Image quality (0-1)
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createExportBundle(postId, options = {}) {
  const {
    imageMaxWidth = 2000,
    imageMaxHeight = 2000,
    imageQuality = 0.85,
  } = options;

  // Get post from database
  const post = await getPost(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  // Get images for the post
  const images = await getImagesByPost(postId);

  // Get blocks from EditorJS content structure
  const blocks = post.content?.blocks || [];

  // Generate HTML content from blocks
  const contentHTML = renderBlocksToHTML(blocks);
  const htmlDocument = generateHTMLDocument(post, contentHTML);

  // Generate Markdown content
  const contentMarkdown = renderBlocksToMarkdown(blocks);
  const markdownDocument = generateMarkdownDocument(post, contentMarkdown);

  // Determine theme to use - check post theme first, then default theme from settings
  let themeName = post.theme;
  if (!themeName || themeName === 'default') {
    themeName = await getDefaultTheme();
  }

  // Combine base CSS with theme CSS
  const themeCSS = combineThemeCSS(themeName);

  // Create ZIP
  const zip = new JSZip();

  // Add HTML file
  zip.file('index.html', htmlDocument);

  // Add Markdown file
  zip.file('index.md', markdownDocument);

  // Add CSS file
  zip.file('css/theme.css', themeCSS);

  // Add optimized images
  for (const image of images) {
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
 * Generate a complete HTML document
 * @param {Object} post - Post object
 * @param {string} post.title - Post title
 * @param {string} contentHTML - Rendered HTML content
 * @returns {string} Complete HTML document
 */
export function generateHTMLDocument(post, contentHTML) {
  const title = escapeHTML(post.title || 'Untitled');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="./css/theme.css">
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
 * Generate a Markdown document with title
 * @param {Object} post - Post object
 * @param {string} post.title - Post title
 * @param {string} contentMarkdown - Rendered Markdown content
 * @returns {string} Complete Markdown document
 */
export function generateMarkdownDocument(post, contentMarkdown) {
  const title = post.title || 'Untitled';
  return `# ${title}\n\n${contentMarkdown}`;
}

/**
 * Combine base CSS with theme-specific CSS
 * @param {string} themeName - Theme name (minimal, modern)
 * @returns {string} Combined CSS content
 */
function combineThemeCSS(themeName) {
  const themeSpecificCSS = THEME_CSS[themeName] || THEME_CSS.minimal;
  return `${baseCSS}\n\n/* Theme: ${themeName} */\n${themeSpecificCSS}`;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
