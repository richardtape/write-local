import { describe, it, expect } from 'vitest';
import { renderBlockToHTML, renderBlocksToHTML } from './html-generator.js';

describe('HTML Generator', () => {
  describe('renderBlockToHTML', () => {
    describe('paragraph blocks', () => {
      it('renders a simple paragraph', () => {
        const block = {
          type: 'paragraph',
          data: { text: 'Hello, world!' },
        };

        expect(renderBlockToHTML(block)).toBe('<p>Hello, world!</p>');
      });

      it('renders a paragraph with inline HTML formatting', () => {
        const block = {
          type: 'paragraph',
          data: { text: 'This is <b>bold</b> and <i>italic</i> text.' },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<p>This is <b>bold</b> and <i>italic</i> text.</p>'
        );
      });

      it('renders an empty paragraph', () => {
        const block = {
          type: 'paragraph',
          data: { text: '' },
        };

        expect(renderBlockToHTML(block)).toBe('<p></p>');
      });

      it('preserves links in paragraphs', () => {
        const block = {
          type: 'paragraph',
          data: { text: 'Check out <a href="https://example.com">this link</a>.' },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<p>Check out <a href="https://example.com">this link</a>.</p>'
        );
      });
    });

    describe('header blocks', () => {
      it('renders an h1 header', () => {
        const block = {
          type: 'header',
          data: { text: 'Main Title', level: 1 },
        };

        expect(renderBlockToHTML(block)).toBe('<h1>Main Title</h1>');
      });

      it('renders an h2 header', () => {
        const block = {
          type: 'header',
          data: { text: 'Section Title', level: 2 },
        };

        expect(renderBlockToHTML(block)).toBe('<h2>Section Title</h2>');
      });

      it('renders an h3 header', () => {
        const block = {
          type: 'header',
          data: { text: 'Subsection', level: 3 },
        };

        expect(renderBlockToHTML(block)).toBe('<h3>Subsection</h3>');
      });

      it('renders h4, h5, and h6 headers', () => {
        expect(
          renderBlockToHTML({ type: 'header', data: { text: 'H4', level: 4 } })
        ).toBe('<h4>H4</h4>');

        expect(
          renderBlockToHTML({ type: 'header', data: { text: 'H5', level: 5 } })
        ).toBe('<h5>H5</h5>');

        expect(
          renderBlockToHTML({ type: 'header', data: { text: 'H6', level: 6 } })
        ).toBe('<h6>H6</h6>');
      });

      it('defaults to h2 when level is missing', () => {
        const block = {
          type: 'header',
          data: { text: 'No Level Specified' },
        };

        expect(renderBlockToHTML(block)).toBe('<h2>No Level Specified</h2>');
      });

      it('renders header with inline formatting', () => {
        const block = {
          type: 'header',
          data: { text: 'Title with <b>bold</b> text', level: 2 },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<h2>Title with <b>bold</b> text</h2>'
        );
      });
    });

    describe('list blocks', () => {
      it('renders an unordered list', () => {
        const block = {
          type: 'list',
          data: {
            style: 'unordered',
            items: ['First item', 'Second item', 'Third item'],
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<ul>\n<li>First item</li>\n<li>Second item</li>\n<li>Third item</li>\n</ul>'
        );
      });

      it('renders an ordered list', () => {
        const block = {
          type: 'list',
          data: {
            style: 'ordered',
            items: ['Step one', 'Step two', 'Step three'],
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<ol>\n<li>Step one</li>\n<li>Step two</li>\n<li>Step three</li>\n</ol>'
        );
      });

      it('renders list items with inline formatting', () => {
        const block = {
          type: 'list',
          data: {
            style: 'unordered',
            items: ['Item with <b>bold</b>', 'Item with <a href="#">link</a>'],
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<ul>\n<li>Item with <b>bold</b></li>\n<li>Item with <a href="#">link</a></li>\n</ul>'
        );
      });

      it('renders empty list', () => {
        const block = {
          type: 'list',
          data: {
            style: 'unordered',
            items: [],
          },
        };

        expect(renderBlockToHTML(block)).toBe('<ul>\n</ul>');
      });

      it('defaults to unordered when style is missing', () => {
        const block = {
          type: 'list',
          data: {
            items: ['Item one', 'Item two'],
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<ul>\n<li>Item one</li>\n<li>Item two</li>\n</ul>'
        );
      });

      it('handles nested list item objects (EditorJS format)', () => {
        const block = {
          type: 'list',
          data: {
            style: 'unordered',
            items: [
              { content: 'First item', items: [] },
              { content: 'Second item', items: [] },
            ],
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<ul>\n<li>First item</li>\n<li>Second item</li>\n</ul>'
        );
      });
    });

    describe('quote blocks', () => {
      it('renders a simple quote', () => {
        const block = {
          type: 'quote',
          data: {
            text: 'To be or not to be.',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<blockquote>\n<p>To be or not to be.</p>\n</blockquote>'
        );
      });

      it('renders a quote with caption', () => {
        const block = {
          type: 'quote',
          data: {
            text: 'The only way to do great work is to love what you do.',
            caption: 'Steve Jobs',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<blockquote>\n<p>The only way to do great work is to love what you do.</p>\n<cite>Steve Jobs</cite>\n</blockquote>'
        );
      });

      it('renders quote with inline formatting', () => {
        const block = {
          type: 'quote',
          data: {
            text: 'This is <i>important</i> advice.',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<blockquote>\n<p>This is <i>important</i> advice.</p>\n</blockquote>'
        );
      });

      it('renders empty quote', () => {
        const block = {
          type: 'quote',
          data: {
            text: '',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<blockquote>\n<p></p>\n</blockquote>'
        );
      });
    });

    describe('code blocks', () => {
      it('renders a code block', () => {
        const block = {
          type: 'code',
          data: {
            code: 'const x = 42;',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<pre><code>const x = 42;</code></pre>'
        );
      });

      it('renders multiline code', () => {
        const block = {
          type: 'code',
          data: {
            code: 'function hello() {\n  console.log("Hello");\n}',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<pre><code>function hello() {\n  console.log("Hello");\n}</code></pre>'
        );
      });

      it('escapes HTML in code blocks', () => {
        const block = {
          type: 'code',
          data: {
            code: '<div class="test">Hello</div>',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<pre><code>&lt;div class="test"&gt;Hello&lt;/div&gt;</code></pre>'
        );
      });

      it('renders empty code block', () => {
        const block = {
          type: 'code',
          data: {
            code: '',
          },
        };

        expect(renderBlockToHTML(block)).toBe('<pre><code></code></pre>');
      });
    });

    describe('image blocks', () => {
      it('renders an image with filename', () => {
        const block = {
          type: 'image',
          data: {
            file: {
              url: 'blob:http://localhost/abc123',
              imageId: 'img-001',
              filename: 'photo.jpg',
            },
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<figure>\n<img src="./images/photo.webp" alt="" />\n</figure>'
        );
      });

      it('renders an image with alt text from tunes', () => {
        const block = {
          type: 'image',
          data: {
            file: {
              url: 'blob:http://localhost/abc123',
              imageId: 'img-001',
              filename: 'sunset.png',
            },
          },
          tunes: {
            altText: {
              alt: 'A beautiful sunset over the ocean',
            },
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<figure>\n<img src="./images/sunset.webp" alt="A beautiful sunset over the ocean" />\n</figure>'
        );
      });

      it('renders an image with caption', () => {
        const block = {
          type: 'image',
          data: {
            file: {
              url: 'blob:http://localhost/abc123',
              imageId: 'img-001',
              filename: 'diagram.png',
            },
            caption: 'Figure 1: System architecture',
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<figure>\n<img src="./images/diagram.webp" alt="" />\n<figcaption>Figure 1: System architecture</figcaption>\n</figure>'
        );
      });

      it('renders an image with alt text and caption', () => {
        const block = {
          type: 'image',
          data: {
            file: {
              url: 'blob:http://localhost/abc123',
              imageId: 'img-001',
              filename: 'chart.jpg',
            },
            caption: 'Q4 2025 Sales Performance',
          },
          tunes: {
            altText: {
              alt: 'Sales chart showing growth',
            },
          },
        };

        expect(renderBlockToHTML(block)).toBe(
          '<figure>\n<img src="./images/chart.webp" alt="Sales chart showing growth" />\n<figcaption>Q4 2025 Sales Performance</figcaption>\n</figure>'
        );
      });

      it('converts various image extensions to webp', () => {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'JPG', 'PNG'];

        extensions.forEach((ext) => {
          const block = {
            type: 'image',
            data: {
              file: {
                url: 'blob:http://localhost/abc123',
                imageId: 'img-001',
                filename: `image.${ext}`,
              },
            },
          };

          expect(renderBlockToHTML(block)).toContain('./images/image.webp');
        });
      });

      it('handles missing file data gracefully', () => {
        const block = {
          type: 'image',
          data: {},
        };

        expect(renderBlockToHTML(block)).toBe('');
      });
    });

    describe('unknown block types', () => {
      it('returns empty string for unknown block types', () => {
        const block = {
          type: 'unknown-type',
          data: { foo: 'bar' },
        };

        expect(renderBlockToHTML(block)).toBe('');
      });

      it('returns empty string for null or undefined blocks', () => {
        expect(renderBlockToHTML(null)).toBe('');
        expect(renderBlockToHTML(undefined)).toBe('');
      });
    });
  });

  describe('renderBlocksToHTML', () => {
    it('renders multiple blocks', () => {
      const blocks = [
        { type: 'header', data: { text: 'My Post', level: 1 } },
        { type: 'paragraph', data: { text: 'First paragraph.' } },
        { type: 'paragraph', data: { text: 'Second paragraph.' } },
      ];

      const html = renderBlocksToHTML(blocks);

      expect(html).toBe(
        '<h1>My Post</h1>\n<p>First paragraph.</p>\n<p>Second paragraph.</p>'
      );
    });

    it('returns empty string for empty array', () => {
      expect(renderBlocksToHTML([])).toBe('');
    });

    it('skips unknown block types', () => {
      const blocks = [
        { type: 'header', data: { text: 'Title', level: 1 } },
        { type: 'unknown', data: {} },
        { type: 'paragraph', data: { text: 'Content.' } },
      ];

      const html = renderBlocksToHTML(blocks);

      expect(html).toBe('<h1>Title</h1>\n<p>Content.</p>');
    });

    it('handles null or undefined input', () => {
      expect(renderBlocksToHTML(null)).toBe('');
      expect(renderBlocksToHTML(undefined)).toBe('');
    });
  });
});
