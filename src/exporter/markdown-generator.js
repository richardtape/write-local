/**
 * Markdown Generator - Convert EditorJS blocks to Markdown
 *
 * This module renders EditorJS JSON blocks to Markdown for export.
 */

/**
 * Convert inline HTML formatting to Markdown
 * Handles: <b>, <strong>, <i>, <em>, <a>, <code>
 * @param {string} text - Text with HTML formatting
 * @returns {string} Text with Markdown formatting
 */
export function convertInlineHTMLToMarkdown(text) {
  if (!text) return '';

  return (
    text
      // Convert links: <a href="url">text</a> → [text](url)
      .replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Convert italic first (so nested <b><i>text</i></b> works correctly)
      .replace(/<(i|em)>(.*?)<\/(i|em)>/gi, '*$2*')
      // Convert bold: <b>text</b> or <strong>text</strong> → **text**
      .replace(/<(b|strong)>(.*?)<\/(b|strong)>/gi, '**$2**')
      // Convert inline code: <code>text</code> → `text`
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
  );
}

/**
 * Render a single EditorJS block to Markdown
 * @param {Object} block - EditorJS block object
 * @param {string} block.type - Block type (paragraph, header, list, etc.)
 * @param {Object} block.data - Block data
 * @param {Object} [block.tunes] - Block tunes data (e.g., altText)
 * @returns {string} Markdown string
 */
export function renderBlockToMarkdown(block) {
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
      return renderImage(block.data, block.tunes);

    default:
      return '';
  }
}

/**
 * Render multiple EditorJS blocks to Markdown
 * @param {Array} blocks - Array of EditorJS block objects
 * @returns {string} Markdown string with double newlines between blocks
 */
export function renderBlocksToMarkdown(blocks) {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }

  return blocks
    .map((block) => renderBlockToMarkdown(block))
    .filter((md) => md !== '')
    .join('\n\n');
}

/**
 * Render a paragraph block
 * @param {Object} data - Paragraph data
 * @param {string} data.text - Paragraph text (may contain inline HTML)
 * @returns {string} Markdown paragraph
 */
function renderParagraph(data) {
  const text = data?.text ?? '';
  return convertInlineHTMLToMarkdown(text);
}

/**
 * Render a header block
 * @param {Object} data - Header data
 * @param {string} data.text - Header text
 * @param {number} [data.level=2] - Header level (1-6)
 * @returns {string} Markdown heading
 */
function renderHeader(data) {
  const text = data?.text ?? '';
  const level = data?.level ?? 2;
  const prefix = '#'.repeat(level);
  return `${prefix} ${convertInlineHTMLToMarkdown(text)}`;
}

/**
 * Render a list block
 * @param {Object} data - List data
 * @param {string} [data.style='unordered'] - List style (ordered/unordered)
 * @param {Array<string>} data.items - List items
 * @returns {string} Markdown list
 */
function renderList(data) {
  const style = data?.style ?? 'unordered';
  const items = data?.items ?? [];

  if (items.length === 0) {
    return '';
  }

  return items
    .map((item, index) => {
      // Handle both string items and object items (nested list structure)
      const text = typeof item === 'string' ? item : (item?.content ?? '');
      const convertedItem = convertInlineHTMLToMarkdown(text);
      if (style === 'ordered') {
        return `${index + 1}. ${convertedItem}`;
      }
      return `- ${convertedItem}`;
    })
    .join('\n');
}

/**
 * Render a quote block
 * @param {Object} data - Quote data
 * @param {string} data.text - Quote text
 * @param {string} [data.caption] - Quote attribution/caption
 * @returns {string} Markdown blockquote
 */
function renderQuote(data) {
  const text = data?.text ?? '';
  const caption = data?.caption;

  let markdown = `> ${convertInlineHTMLToMarkdown(text)}`;

  if (caption) {
    markdown += `\n>\n> — ${caption}`;
  }

  return markdown;
}

/**
 * Render a code block
 * @param {Object} data - Code data
 * @param {string} data.code - Code content
 * @returns {string} Markdown fenced code block
 */
function renderCode(data) {
  const code = data?.code ?? '';
  return `\`\`\`\n${code}\n\`\`\``;
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
 * @returns {string} Markdown image
 */
function renderImage(data, tunes) {
  const file = data?.file;

  // Handle missing file data
  if (!file || !file.filename) {
    return '';
  }

  // Convert filename to WebP extension for optimized export
  const webpFilename = convertToWebpFilename(file.filename);
  const src = `./images/${webpFilename}`;
  // Alt text comes from the altText tune, not from block data
  const alt = tunes?.altText?.alt ?? '';
  const caption = data?.caption;

  let markdown = `![${alt}](${src})`;

  if (caption) {
    markdown += `\n\n*${caption}*`;
  }

  return markdown;
}

/**
 * Convert an image filename to WebP format
 * @param {string} filename - Original filename
 * @returns {string} Filename with .webp extension
 */
function convertToWebpFilename(filename) {
  return filename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
}
