import { describe, it, expect } from 'vitest';
import {
  renderBlockToMarkdown,
  renderBlocksToMarkdown,
  convertInlineHTMLToMarkdown,
} from './markdown-generator.js';

describe('Markdown Generator', () => {
  describe('convertInlineHTMLToMarkdown', () => {
    it('converts bold tags to markdown', () => {
      expect(convertInlineHTMLToMarkdown('This is <b>bold</b> text.')).toBe(
        'This is **bold** text.'
      );
    });

    it('converts strong tags to markdown', () => {
      expect(
        convertInlineHTMLToMarkdown('This is <strong>strong</strong> text.')
      ).toBe('This is **strong** text.');
    });

    it('converts italic tags to markdown', () => {
      expect(convertInlineHTMLToMarkdown('This is <i>italic</i> text.')).toBe(
        'This is *italic* text.'
      );
    });

    it('converts em tags to markdown', () => {
      expect(convertInlineHTMLToMarkdown('This is <em>emphasized</em> text.')).toBe(
        'This is *emphasized* text.'
      );
    });

    it('converts links to markdown', () => {
      expect(
        convertInlineHTMLToMarkdown('Check out <a href="https://example.com">this link</a>.')
      ).toBe('Check out [this link](https://example.com).');
    });

    it('converts multiple inline elements', () => {
      expect(
        convertInlineHTMLToMarkdown('This is <b>bold</b> and <i>italic</i> text.')
      ).toBe('This is **bold** and *italic* text.');
    });

    it('handles nested formatting', () => {
      expect(
        convertInlineHTMLToMarkdown('This is <b><i>bold italic</i></b> text.')
      ).toBe('This is ***bold italic*** text.');
    });

    it('returns plain text unchanged', () => {
      expect(convertInlineHTMLToMarkdown('Just plain text.')).toBe(
        'Just plain text.'
      );
    });

    it('handles empty string', () => {
      expect(convertInlineHTMLToMarkdown('')).toBe('');
    });
  });

  describe('renderBlockToMarkdown', () => {
    describe('paragraph blocks', () => {
      it('renders a simple paragraph', () => {
        const block = {
          type: 'paragraph',
          data: { text: 'Hello, world!' },
        };

        expect(renderBlockToMarkdown(block)).toBe('Hello, world!');
      });

      it('converts inline HTML to markdown', () => {
        const block = {
          type: 'paragraph',
          data: { text: 'This is <b>bold</b> and <i>italic</i> text.' },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          'This is **bold** and *italic* text.'
        );
      });

      it('converts links to markdown format', () => {
        const block = {
          type: 'paragraph',
          data: { text: 'Check out <a href="https://example.com">this link</a>.' },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          'Check out [this link](https://example.com).'
        );
      });

      it('renders empty paragraph', () => {
        const block = {
          type: 'paragraph',
          data: { text: '' },
        };

        expect(renderBlockToMarkdown(block)).toBe('');
      });
    });

    describe('header blocks', () => {
      it('renders h1 with single #', () => {
        const block = {
          type: 'header',
          data: { text: 'Main Title', level: 1 },
        };

        expect(renderBlockToMarkdown(block)).toBe('# Main Title');
      });

      it('renders h2 with ##', () => {
        const block = {
          type: 'header',
          data: { text: 'Section Title', level: 2 },
        };

        expect(renderBlockToMarkdown(block)).toBe('## Section Title');
      });

      it('renders h3 through h6', () => {
        expect(
          renderBlockToMarkdown({ type: 'header', data: { text: 'H3', level: 3 } })
        ).toBe('### H3');

        expect(
          renderBlockToMarkdown({ type: 'header', data: { text: 'H4', level: 4 } })
        ).toBe('#### H4');

        expect(
          renderBlockToMarkdown({ type: 'header', data: { text: 'H5', level: 5 } })
        ).toBe('##### H5');

        expect(
          renderBlockToMarkdown({ type: 'header', data: { text: 'H6', level: 6 } })
        ).toBe('###### H6');
      });

      it('defaults to h2 when level is missing', () => {
        const block = {
          type: 'header',
          data: { text: 'No Level' },
        };

        expect(renderBlockToMarkdown(block)).toBe('## No Level');
      });

      it('converts inline formatting in headers', () => {
        const block = {
          type: 'header',
          data: { text: 'Title with <b>bold</b>', level: 2 },
        };

        expect(renderBlockToMarkdown(block)).toBe('## Title with **bold**');
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

        expect(renderBlockToMarkdown(block)).toBe(
          '- First item\n- Second item\n- Third item'
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

        expect(renderBlockToMarkdown(block)).toBe(
          '1. Step one\n2. Step two\n3. Step three'
        );
      });

      it('converts inline formatting in list items', () => {
        const block = {
          type: 'list',
          data: {
            style: 'unordered',
            items: ['Item with <b>bold</b>', 'Item with <a href="#">link</a>'],
          },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          '- Item with **bold**\n- Item with [link](#)'
        );
      });

      it('renders empty list as empty string', () => {
        const block = {
          type: 'list',
          data: {
            style: 'unordered',
            items: [],
          },
        };

        expect(renderBlockToMarkdown(block)).toBe('');
      });

      it('defaults to unordered when style is missing', () => {
        const block = {
          type: 'list',
          data: {
            items: ['Item one', 'Item two'],
          },
        };

        expect(renderBlockToMarkdown(block)).toBe('- Item one\n- Item two');
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

        expect(renderBlockToMarkdown(block)).toBe('- First item\n- Second item');
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

        expect(renderBlockToMarkdown(block)).toBe('> To be or not to be.');
      });

      it('renders a quote with caption', () => {
        const block = {
          type: 'quote',
          data: {
            text: 'The only way to do great work is to love what you do.',
            caption: 'Steve Jobs',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          '> The only way to do great work is to love what you do.\n>\n> — Steve Jobs'
        );
      });

      it('converts inline formatting in quotes', () => {
        const block = {
          type: 'quote',
          data: {
            text: 'This is <i>important</i> advice.',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe('> This is *important* advice.');
      });

      it('renders empty quote', () => {
        const block = {
          type: 'quote',
          data: {
            text: '',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe('> ');
      });
    });

    describe('code blocks', () => {
      it('renders a code block with fences', () => {
        const block = {
          type: 'code',
          data: {
            code: 'const x = 42;',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe('```\nconst x = 42;\n```');
      });

      it('renders multiline code', () => {
        const block = {
          type: 'code',
          data: {
            code: 'function hello() {\n  console.log("Hello");\n}',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          '```\nfunction hello() {\n  console.log("Hello");\n}\n```'
        );
      });

      it('preserves HTML in code blocks (no escaping needed)', () => {
        const block = {
          type: 'code',
          data: {
            code: '<div class="test">Hello</div>',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          '```\n<div class="test">Hello</div>\n```'
        );
      });

      it('renders empty code block', () => {
        const block = {
          type: 'code',
          data: {
            code: '',
          },
        };

        expect(renderBlockToMarkdown(block)).toBe('```\n\n```');
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

        expect(renderBlockToMarkdown(block)).toBe('![](./images/photo.webp)');
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

        expect(renderBlockToMarkdown(block)).toBe(
          '![A beautiful sunset over the ocean](./images/sunset.webp)'
        );
      });

      it('renders an image with caption as italic text below', () => {
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

        expect(renderBlockToMarkdown(block)).toBe(
          '![](./images/diagram.webp)\n\n*Figure 1: System architecture*'
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
            caption: 'Q4 2025 Sales',
          },
          tunes: {
            altText: {
              alt: 'Sales chart',
            },
          },
        };

        expect(renderBlockToMarkdown(block)).toBe(
          '![Sales chart](./images/chart.webp)\n\n*Q4 2025 Sales*'
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

          expect(renderBlockToMarkdown(block)).toContain('./images/image.webp');
        });
      });

      it('handles missing file data gracefully', () => {
        const block = {
          type: 'image',
          data: {},
        };

        expect(renderBlockToMarkdown(block)).toBe('');
      });
    });

    describe('unknown block types', () => {
      it('returns empty string for unknown block types', () => {
        const block = {
          type: 'unknown-type',
          data: { foo: 'bar' },
        };

        expect(renderBlockToMarkdown(block)).toBe('');
      });

      it('returns empty string for null or undefined blocks', () => {
        expect(renderBlockToMarkdown(null)).toBe('');
        expect(renderBlockToMarkdown(undefined)).toBe('');
      });
    });
  });

  describe('renderBlocksToMarkdown', () => {
    it('renders multiple blocks with double newlines between', () => {
      const blocks = [
        { type: 'header', data: { text: 'My Post', level: 1 } },
        { type: 'paragraph', data: { text: 'First paragraph.' } },
        { type: 'paragraph', data: { text: 'Second paragraph.' } },
      ];

      const markdown = renderBlocksToMarkdown(blocks);

      expect(markdown).toBe(
        '# My Post\n\nFirst paragraph.\n\nSecond paragraph.'
      );
    });

    it('returns empty string for empty array', () => {
      expect(renderBlocksToMarkdown([])).toBe('');
    });

    it('skips unknown block types', () => {
      const blocks = [
        { type: 'header', data: { text: 'Title', level: 1 } },
        { type: 'unknown', data: {} },
        { type: 'paragraph', data: { text: 'Content.' } },
      ];

      const markdown = renderBlocksToMarkdown(blocks);

      expect(markdown).toBe('# Title\n\nContent.');
    });

    it('handles null or undefined input', () => {
      expect(renderBlocksToMarkdown(null)).toBe('');
      expect(renderBlocksToMarkdown(undefined)).toBe('');
    });

    it('renders a complete blog post', () => {
      const blocks = [
        { type: 'header', data: { text: 'Getting Started with JavaScript', level: 1 } },
        { type: 'paragraph', data: { text: 'JavaScript is a <b>powerful</b> language.' } },
        { type: 'header', data: { text: 'Variables', level: 2 } },
        { type: 'paragraph', data: { text: 'You can declare variables using:' } },
        {
          type: 'list',
          data: {
            style: 'unordered',
            items: ['<code>let</code> for mutable variables', '<code>const</code> for constants'],
          },
        },
        { type: 'code', data: { code: 'const name = "World";\nconsole.log(`Hello, ${name}!`);' } },
      ];

      const markdown = renderBlocksToMarkdown(blocks);

      expect(markdown).toContain('# Getting Started with JavaScript');
      expect(markdown).toContain('JavaScript is a **powerful** language.');
      expect(markdown).toContain('## Variables');
      expect(markdown).toContain('- `let` for mutable variables');
      expect(markdown).toContain('```\nconst name = "World";');
    });
  });
});
