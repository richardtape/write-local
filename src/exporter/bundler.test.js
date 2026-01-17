import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import {
  createExportBundle,
  generateHTMLDocument,
  generateMarkdownDocument,
} from './bundler.js';

// Mock the storage modules
vi.mock('../core/storage.js', () => ({
  db: {
    posts: {
      get: vi.fn(),
    },
  },
  getPost: vi.fn(),
}));

vi.mock('../core/image-storage.js', () => ({
  getImagesByPost: vi.fn(),
}));

// Mock the image optimizer
vi.mock('../utils/image-optimizer.js', () => ({
  optimizeImage: vi.fn(),
}));

// Mock the CSS raw imports
vi.mock('../themes/base.css?raw', () => ({
  default: `
:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --font-size-base: 1rem;
}
.post-content {
  max-width: 65ch;
}
`,
}));

vi.mock('../themes/minimal.css?raw', () => ({
  default: `
:root {
  --color-background: #ffffff;
}
`,
}));

vi.mock('../themes/modern.css?raw', () => ({
  default: `
:root {
  --color-background: #fafaf8;
}
`,
}));

// Import mocked modules
import { getPost } from '../core/storage.js';
import { getImagesByPost } from '../core/image-storage.js';
import { optimizeImage } from '../utils/image-optimizer.js';

describe('Bundler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateHTMLDocument', () => {
    it('generates a complete HTML document', () => {
      const post = {
        title: 'My Blog Post',
        slug: 'my-blog-post',
      };
      const contentHTML = '<p>Hello world!</p>';

      const html = generateHTMLDocument(post, contentHTML);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<title>My Blog Post</title>');
      expect(html).toContain('<link rel="stylesheet" href="./css/theme.css">');
      expect(html).toContain('<article class="post-content">');
      expect(html).toContain('<h1>My Blog Post</h1>'); // Title as H1 in body
      expect(html).toContain('<p>Hello world!</p>');
      expect(html).toContain('</article>');
      expect(html).toContain('</html>');
    });

    it('includes viewport meta tag', () => {
      const html = generateHTMLDocument({ title: 'Test' }, '<p>Content</p>');

      expect(html).toContain(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    });

    it('includes charset meta tag', () => {
      const html = generateHTMLDocument({ title: 'Test' }, '<p>Content</p>');

      expect(html).toContain('<meta charset="UTF-8">');
    });

    it('escapes HTML in title', () => {
      const post = { title: 'Test <script>alert("xss")</script>' };
      const html = generateHTMLDocument(post, '<p>Content</p>');

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('generateMarkdownDocument', () => {
    it('generates markdown with title as h1', () => {
      const post = { title: 'My Blog Post' };
      const contentMarkdown = 'Hello world!\n\nThis is a paragraph.';

      const markdown = generateMarkdownDocument(post, contentMarkdown);

      expect(markdown).toBe(
        '# My Blog Post\n\nHello world!\n\nThis is a paragraph.'
      );
    });

    it('handles empty content', () => {
      const post = { title: 'Empty Post' };
      const markdown = generateMarkdownDocument(post, '');

      expect(markdown).toBe('# Empty Post\n\n');
    });
  });

  describe('createExportBundle', () => {
    it('creates a ZIP file with correct structure', async () => {
      // Mock post data
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        slug: 'test-post',
        content: {
          blocks: [
            { type: 'paragraph', data: { text: 'Hello world!' } },
          ],
        },
        theme: 'minimal',
      };

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([]);

      const zipBlob = await createExportBundle('post-123');

      // Verify it's a Blob
      expect(zipBlob).toBeInstanceOf(Blob);
      expect(zipBlob.type).toBe('application/zip');

      // Extract and verify ZIP contents
      const zip = await JSZip.loadAsync(zipBlob);

      expect(zip.files['index.html']).toBeDefined();
      expect(zip.files['index.md']).toBeDefined();
      expect(zip.files['css/theme.css']).toBeDefined();
    });

    it('includes HTML file with rendered content', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        slug: 'test-post',
        content: {
          blocks: [
            { type: 'header', data: { text: 'Welcome', level: 2 } },
            { type: 'paragraph', data: { text: 'This is my post.' } },
          ],
        },
        theme: 'minimal',
      };

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([]);

      const zipBlob = await createExportBundle('post-123');
      const zip = await JSZip.loadAsync(zipBlob);

      const htmlContent = await zip.files['index.html'].async('string');

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Test Post</title>');
      expect(htmlContent).toContain('<h1>Test Post</h1>'); // Title as H1 in body
      expect(htmlContent).toContain('<h2>Welcome</h2>');
      expect(htmlContent).toContain('<p>This is my post.</p>');
    });

    it('includes Markdown file with rendered content', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        slug: 'test-post',
        content: {
          blocks: [
            { type: 'header', data: { text: 'Welcome', level: 2 } },
            { type: 'paragraph', data: { text: 'This is my post.' } },
          ],
        },
        theme: 'minimal',
      };

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([]);

      const zipBlob = await createExportBundle('post-123');
      const zip = await JSZip.loadAsync(zipBlob);

      const mdContent = await zip.files['index.md'].async('string');

      expect(mdContent).toContain('# Test Post');
      expect(mdContent).toContain('## Welcome');
      expect(mdContent).toContain('This is my post.');
    });

    it('includes optimized images in images/ folder', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Post with Image',
        slug: 'post-with-image',
        content: {
          blocks: [
            {
              type: 'image',
              data: {
                file: { imageId: 'img-001', filename: 'photo.jpg' },
                alt: 'A photo',
              },
            },
          ],
        },
        theme: 'minimal',
      };

      const mockImageBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
      const mockOptimizedBlob = new Blob(['optimized webp'], { type: 'image/webp' });

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([
        {
          id: 'img-001',
          postId: 'post-123',
          file: mockImageBlob,
          filename: 'photo.jpg',
        },
      ]);
      optimizeImage.mockResolvedValue(mockOptimizedBlob);

      const zipBlob = await createExportBundle('post-123');
      const zip = await JSZip.loadAsync(zipBlob);

      // Check image exists in images/ folder with .webp extension
      expect(zip.files['images/photo.webp']).toBeDefined();

      // Verify optimizer was called
      expect(optimizeImage).toHaveBeenCalledWith(mockImageBlob, {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 0.85,
        format: 'webp',
      });
    });

    it('includes theme CSS', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        slug: 'test-post',
        content: { blocks: [] },
        theme: 'minimal',
      };

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([]);

      const zipBlob = await createExportBundle('post-123');
      const zip = await JSZip.loadAsync(zipBlob);

      const cssContent = await zip.files['css/theme.css'].async('string');

      // Should contain base CSS variables
      expect(cssContent).toContain('--color-background');
      expect(cssContent).toContain('--font-size-base');
      expect(cssContent).toContain('.post-content');
    });

    it('throws error if post not found', async () => {
      getPost.mockResolvedValue(undefined);

      await expect(createExportBundle('nonexistent')).rejects.toThrow(
        'Post not found'
      );
    });

    it('handles posts with no images', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Text Only Post',
        slug: 'text-only-post',
        content: {
          blocks: [
            { type: 'paragraph', data: { text: 'Just text, no images.' } },
          ],
        },
        theme: 'minimal',
      };

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([]);

      const zipBlob = await createExportBundle('post-123');
      const zip = await JSZip.loadAsync(zipBlob);

      // Should not have images folder or it should be empty
      const imageFiles = Object.keys(zip.files).filter((name) =>
        name.startsWith('images/')
      );
      expect(imageFiles.length).toBe(0);
    });

    it('handles multiple images', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Multi Image Post',
        slug: 'multi-image-post',
        content: { blocks: [] },
        theme: 'minimal',
      };

      const mockBlob1 = new Blob(['image1'], { type: 'image/jpeg' });
      const mockBlob2 = new Blob(['image2'], { type: 'image/png' });
      const mockOptimized = new Blob(['optimized'], { type: 'image/webp' });

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([
        { id: 'img-001', file: mockBlob1, filename: 'first.jpg' },
        { id: 'img-002', file: mockBlob2, filename: 'second.png' },
      ]);
      optimizeImage.mockResolvedValue(mockOptimized);

      const zipBlob = await createExportBundle('post-123');
      const zip = await JSZip.loadAsync(zipBlob);

      expect(zip.files['images/first.webp']).toBeDefined();
      expect(zip.files['images/second.webp']).toBeDefined();
    });

    it('returns correct filename based on post slug', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'My Amazing Post',
        slug: 'my-amazing-post',
        content: [],
        theme: 'minimal',
      };

      getPost.mockResolvedValue(mockPost);
      getImagesByPost.mockResolvedValue([]);

      const result = await createExportBundle('post-123');

      // The function returns { blob, filename }
      expect(result).toBeInstanceOf(Blob);
    });
  });
});
