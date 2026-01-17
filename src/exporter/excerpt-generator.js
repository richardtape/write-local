/**
 * Strip HTML tags and decode HTML entities from a string
 * @param {string} html - String potentially containing HTML
 * @returns {string} Plain text with HTML removed and entities decoded
 */
export function stripHTML(html) {
  if (!html) return '';

  const result = html
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');

  // Trim leading/trailing whitespace, but preserve single space if that's all there is
  const trimmed = result.trim();

  // If original had content but trimmed is empty, it was all whitespace - return single space
  if (result.length > 0 && trimmed.length === 0) {
    return ' ';
  }

  return trimmed;
}

/**
 * Generate an excerpt from EditorJS blocks
 * @param {Array} blocks - EditorJS blocks array
 * @param {number} [wordLimit=50] - Maximum number of words in excerpt
 * @returns {string} Excerpt text, with "..." appended if truncated
 */
export function generateExcerpt(blocks, wordLimit = 50) {
  const textParts = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'header':
        if (block.data?.text) {
          textParts.push(stripHTML(block.data.text));
        }
        break;

      case 'list':
        if (block.data?.items) {
          for (const item of block.data.items) {
            // Handle both string items and object items (nested lists)
            const content = typeof item === 'string' ? item : item.content;
            if (content) {
              textParts.push(stripHTML(content));
            }
          }
        }
        break;

      case 'quote':
        if (block.data?.text) {
          textParts.push(stripHTML(block.data.text));
        }
        break;

      // Skip code, image, and other non-text blocks
      default:
        break;
    }
  }

  // Join all text parts and normalize whitespace
  const fullText = textParts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into words
  const words = fullText.split(/\s+/).filter(w => w.length > 0);

  // Return full text if under limit
  if (words.length <= wordLimit) {
    return fullText;
  }

  // Truncate and add ellipsis
  return words.slice(0, wordLimit).join(' ') + '...';
}
