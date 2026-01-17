import { describe, it, expect } from 'vitest';
import { generateExcerpt, stripHTML } from './excerpt-generator.js';

describe('Excerpt Generator', () => {
  describe('generateExcerpt', () => {
    it('should extract text from a paragraph block', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Hello world' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Hello world');
    });

    it('should extract text from multiple paragraph blocks', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'First paragraph.' } },
        { type: 'paragraph', data: { text: 'Second paragraph.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('First paragraph. Second paragraph.');
    });

    it('should extract text from header blocks', () => {
      const blocks = [
        { type: 'header', data: { text: 'Main Title', level: 1 } },
        { type: 'paragraph', data: { text: 'Some content here.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Main Title Some content here.');
    });

    it('should extract text from list blocks with string items', () => {
      const blocks = [
        { type: 'list', data: { style: 'unordered', items: ['First item', 'Second item', 'Third item'] } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('First item Second item Third item');
    });

    it('should extract text from list blocks with object items (nested lists)', () => {
      const blocks = [
        {
          type: 'list',
          data: {
            style: 'ordered',
            items: [
              { content: 'Parent item', items: [] },
              { content: 'Another parent', items: [] }
            ]
          }
        }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Parent item Another parent');
    });

    it('should extract text from quote blocks', () => {
      const blocks = [
        { type: 'quote', data: { text: 'A wise saying', caption: 'Anonymous' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('A wise saying');
    });

    it('should skip code blocks', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Before code.' } },
        { type: 'code', data: { code: 'const x = 1;' } },
        { type: 'paragraph', data: { text: 'After code.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Before code. After code.');
    });

    it('should skip image blocks', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Before image.' } },
        { type: 'image', data: { file: { url: 'test.jpg' }, caption: 'A photo' } },
        { type: 'paragraph', data: { text: 'After image.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Before image. After image.');
    });

    it('should limit to 50 words by default and add ellipsis', () => {
      // Create a paragraph with 60 words
      const words = Array(60).fill('word').join(' ');
      const blocks = [
        { type: 'paragraph', data: { text: words } }
      ];

      const excerpt = generateExcerpt(blocks);

      const excerptWords = excerpt.replace('...', '').trim().split(/\s+/);
      expect(excerptWords).toHaveLength(50);
      expect(excerpt.endsWith('...')).toBe(true);
    });

    it('should not add ellipsis when content is under word limit', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Short content here.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Short content here.');
      expect(excerpt.endsWith('...')).toBe(false);
    });

    it('should respect custom word limit', () => {
      const words = Array(20).fill('word').join(' ');
      const blocks = [
        { type: 'paragraph', data: { text: words } }
      ];

      const excerpt = generateExcerpt(blocks, 10);

      const excerptWords = excerpt.replace('...', '').trim().split(/\s+/);
      expect(excerptWords).toHaveLength(10);
      expect(excerpt.endsWith('...')).toBe(true);
    });

    it('should handle empty blocks array', () => {
      const excerpt = generateExcerpt([]);

      expect(excerpt).toBe('');
    });

    it('should handle blocks with empty text', () => {
      const blocks = [
        { type: 'paragraph', data: { text: '' } },
        { type: 'paragraph', data: { text: 'Some content.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Some content.');
    });

    it('should strip HTML tags from text', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Hello <b>bold</b> and <i>italic</i> text.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Hello bold and italic text.');
    });

    it('should handle links in text', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Check out <a href="https://example.com">this link</a> for more.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Check out this link for more.');
    });

    it('should decode HTML entities', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Tom &amp; Jerry &lt;3 each other&apos;s company.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe("Tom & Jerry <3 each other's company.");
    });

    it('should normalize whitespace', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Too    many     spaces   here.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Too many spaces here.');
    });

    it('should handle nbsp entities', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Hello&nbsp;world&nbsp;test.' } }
      ];

      const excerpt = generateExcerpt(blocks);

      expect(excerpt).toBe('Hello world test.');
    });
  });

  describe('stripHTML', () => {
    it('should remove HTML tags', () => {
      expect(stripHTML('<b>bold</b>')).toBe('bold');
      expect(stripHTML('<i>italic</i>')).toBe('italic');
      expect(stripHTML('<a href="url">link</a>')).toBe('link');
    });

    it('should decode common HTML entities', () => {
      expect(stripHTML('&amp;')).toBe('&');
      expect(stripHTML('&lt;')).toBe('<');
      expect(stripHTML('&gt;')).toBe('>');
      expect(stripHTML('&nbsp;')).toBe(' ');
      expect(stripHTML('&apos;')).toBe("'");
      expect(stripHTML('&quot;')).toBe('"');
    });

    it('should handle mixed content', () => {
      expect(stripHTML('<b>Bold &amp; italic</b>')).toBe('Bold & italic');
    });

    it('should trim whitespace', () => {
      expect(stripHTML('  hello world  ')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(stripHTML('')).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      expect(stripHTML(null)).toBe('');
      expect(stripHTML(undefined)).toBe('');
    });
  });
});
