/**
 * HTML Generator - Convert EditorJS blocks to HTML
 *
 * This module renders EditorJS JSON blocks to static HTML for export.
 */

/**
 * Render a single EditorJS block to HTML
 * @param {Object} block - EditorJS block object
 * @param {string} block.type - Block type (paragraph, header, list, etc.)
 * @param {Object} block.data - Block data
 * @param {Object} [block.tunes] - Block tunes data (e.g., altText)
 * @param {Object} [options] - Rendering options
 * @param {string} [options.imagePathPrefix='./images/'] - Prefix for image paths
 * @returns {string} HTML string
 */
export function renderBlockToHTML(block, options = {}) {
  if (!block || !block.type) {
    return '';
  }

  switch (block.type) {
    case 'paragraph':
      return renderParagraph(block.data);

    case 'header':
      return renderHeader(block.data);

    case 'list':
      return renderList(block.data);

    case 'quote':
      return renderQuote(block.data);

    case 'code':
      return renderCode(block.data);

    case 'image':
      return renderImage(block.data, block.tunes, options);

    default:
      return '';
  }
}

/**
 * Render multiple EditorJS blocks to HTML
 * @param {Array} blocks - Array of EditorJS block objects
 * @param {Object} [options] - Rendering options
 * @param {string} [options.imagePathPrefix='./images/'] - Prefix for image paths
 * @returns {string} HTML string with newlines between blocks
 */
export function renderBlocksToHTML(blocks, options = {}) {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }

  return blocks
    .map((block) => renderBlockToHTML(block, options))
    .filter((html) => html !== '')
    .join('\n');
}

/**
 * Render a paragraph block
 * @param {Object} data - Paragraph data
 * @param {string} data.text - Paragraph text (may contain inline HTML)
 * @returns {string} HTML paragraph element
 */
function renderParagraph(data) {
  const text = data?.text ?? '';
  return `<p>${text}</p>`;
}

/**
 * Render a header block
 * @param {Object} data - Header data
 * @param {string} data.text - Header text
 * @param {number} [data.level=2] - Header level (1-6)
 * @returns {string} HTML heading element
 */
function renderHeader(data) {
  const text = data?.text ?? '';
  const level = data?.level ?? 2;
  return `<h${level}>${text}</h${level}>`;
}

/**
 * Render a list block
 * @param {Object} data - List data
 * @param {string} [data.style='unordered'] - List style (ordered/unordered)
 * @param {Array<string>} data.items - List items
 * @returns {string} HTML list element
 */
function renderList(data) {
  const style = data?.style ?? 'unordered';
  const items = data?.items ?? [];
  const tag = style === 'ordered' ? 'ol' : 'ul';

  if (items.length === 0) {
    return `<${tag}>\n</${tag}>`;
  }

  const listItems = items.map((item) => {
    // Handle both string items and object items (nested list structure)
    const text = typeof item === 'string' ? item : (item?.content ?? '');
    return `<li>${text}</li>`;
  }).join('\n');

  return `<${tag}>\n${listItems}\n</${tag}>`;
}

/**
 * Render a quote block
 * @param {Object} data - Quote data
 * @param {string} data.text - Quote text
 * @param {string} [data.caption] - Quote attribution/caption
 * @returns {string} HTML blockquote element
 */
function renderQuote(data) {
  const text = data?.text ?? '';
  const caption = data?.caption;

  let html = `<blockquote>\n<p>${text}</p>`;

  if (caption) {
    html += `\n<cite>${caption}</cite>`;
  }

  html += '\n</blockquote>';

  return html;
}

/**
 * Render a code block
 * @param {Object} data - Code data
 * @param {string} data.code - Code content
 * @returns {string} HTML pre/code element
 */
function renderCode(data) {
  const code = data?.code ?? '';
  // Escape HTML entities in code to prevent rendering
  const escapedCode = escapeHTML(code);
  return `<pre><code>${escapedCode}</code></pre>`;
}

/**
 * Render an image block
 * @param {Object} data - Image data
 * @param {Object} data.file - File information
 * @param {string} data.file.filename - Original filename
 * @param {string} [data.caption] - Image caption
 * @param {Object} [tunes] - Block tunes data
 * @param {Object} [tunes.altText] - Alt text tune data
 * @param {string} [tunes.altText.alt] - Alt text for accessibility
 * @param {Object} [options] - Rendering options
 * @param {string} [options.imagePathPrefix='./images/'] - Prefix for image paths
 * @returns {string} HTML figure element with img
 */
function renderImage(data, tunes, options = {}) {
  const file = data?.file;
  const imagePathPrefix = options.imagePathPrefix ?? './images/';

  // Handle missing file data
  if (!file || !file.filename) {
    return '';
  }

  // Convert filename to WebP extension for optimized export
  const webpFilename = convertToWebpFilename(file.filename);
  const src = `${imagePathPrefix}${webpFilename}`;
  // Alt text comes from the altText tune, not from block data
  const alt = tunes?.altText?.alt ?? '';
  const caption = data?.caption;

  let html = `<figure>\n<img src="${src}" alt="${escapeAttribute(alt)}" />`;

  if (caption) {
    html += `\n<figcaption>${caption}</figcaption>`;
  }

  html += '\n</figure>';

  return html;
}

/**
 * Escape HTML attribute value
 * @param {string} value - Value to escape
 * @returns {string} Escaped value safe for use in attributes
 */
function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape HTML special characters for text content
 * Only escapes &, <, > (quotes don't need escaping in text content)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert an image filename to WebP format
 * @param {string} filename - Original filename
 * @returns {string} Filename with .webp extension
 */
function convertToWebpFilename(filename) {
  return filename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
}
