import { describe, it, expect } from 'vitest';
import { generateArchiveHTML, formatArchiveDate } from './archive-generator.js';

describe('Archive Generator', () => {
  // Sample posts for testing
  const samplePosts = [
    {
      id: '1',
      title: 'First Post',
      slug: 'first-post',
      content: { blocks: [{ type: 'paragraph', data: { text: 'Content of the first post here.' } }] },
      publishedAt: new Date('2026-01-15').getTime(),
      status: 'published'
    },
    {
      id: '2',
      title: 'Second Post',
      slug: 'second-post',
      content: { blocks: [{ type: 'paragraph', data: { text: 'Content of the second post.' } }] },
      publishedAt: new Date('2026-01-10').getTime(),
      status: 'published'
    },
    {
      id: '3',
      title: 'Third Post',
      slug: 'third-post',
      content: { blocks: [{ type: 'paragraph', data: { text: 'The third post content goes here.' } }] },
      publishedAt: new Date('2026-01-05').getTime(),
      status: 'published'
    }
  ];

  const siteConfig = {
    archiveTitle: 'My Blog',
    archiveTemplate: 'simple-list',
    archiveTheme: 'minimal'
  };

  describe('generateArchiveHTML', () => {
    describe('simple-list template', () => {
      it('should generate valid HTML structure', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html');
        expect(html).toContain('</html>');
        expect(html).toContain('<head>');
        expect(html).toContain('<body>');
      });

      it('should include the archive title as h1', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('<h1 class="archive-title">My Blog</h1>');
      });

      it('should include all posts as list items', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('First Post');
        expect(html).toContain('Second Post');
        expect(html).toContain('Third Post');
      });

      it('should link posts to their slug directories', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('href="./first-post/"');
        expect(html).toContain('href="./second-post/"');
        expect(html).toContain('href="./third-post/"');
      });

      it('should include formatted dates', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('January 15, 2026');
        expect(html).toContain('January 10, 2026');
        expect(html).toContain('January 5, 2026');
      });

      it('should include datetime attributes on time elements', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('datetime="2026-01-15"');
        expect(html).toContain('datetime="2026-01-10"');
        expect(html).toContain('datetime="2026-01-05"');
      });

      it('should NOT include excerpts in simple-list template', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).not.toContain('class="post-excerpt"');
        expect(html).not.toContain('Content of the first post');
      });

      it('should use proper CSS classes', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('class="archive-content"');
        expect(html).toContain('class="post-list"');
        expect(html).toContain('class="post-item"');
        expect(html).toContain('class="post-link"');
        expect(html).toContain('class="post-date"');
      });

      it('should include CSS link to theme', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('<link rel="stylesheet" href="./css/archive.css">');
      });

      it('should set proper meta tags', () => {
        const html = generateArchiveHTML(samplePosts, siteConfig);

        expect(html).toContain('<meta charset="UTF-8">');
        expect(html).toContain('<meta name="viewport"');
        expect(html).toContain('<title>My Blog</title>');
      });
    });

    describe('list-with-excerpts template', () => {
      const excerptConfig = {
        ...siteConfig,
        archiveTemplate: 'list-with-excerpts'
      };

      it('should include excerpts for each post', () => {
        const html = generateArchiveHTML(samplePosts, excerptConfig);

        expect(html).toContain('class="post-excerpt"');
      });

      it('should generate excerpts from post content', () => {
        const html = generateArchiveHTML(samplePosts, excerptConfig);

        expect(html).toContain('Content of the first post here.');
        expect(html).toContain('Content of the second post.');
        expect(html).toContain('The third post content goes here.');
      });

      it('should truncate long excerpts', () => {
        const longPost = {
          id: '4',
          title: 'Long Post',
          slug: 'long-post',
          content: {
            blocks: [{
              type: 'paragraph',
              data: { text: Array(60).fill('word').join(' ') }
            }]
          },
          publishedAt: new Date('2026-01-20').getTime(),
          status: 'published'
        };

        const html = generateArchiveHTML([longPost], excerptConfig);

        expect(html).toContain('...');
      });

      it('should still include title, link, and date', () => {
        const html = generateArchiveHTML(samplePosts, excerptConfig);

        expect(html).toContain('<h1 class="archive-title">My Blog</h1>');
        expect(html).toContain('href="./first-post/"');
        expect(html).toContain('January 15, 2026');
      });
    });

    describe('post sorting', () => {
      it('should sort posts by publishedAt descending (newest first)', () => {
        // Pass posts in wrong order
        const unorderedPosts = [samplePosts[2], samplePosts[0], samplePosts[1]];
        const html = generateArchiveHTML(unorderedPosts, siteConfig);

        // Find positions of post titles
        const firstPos = html.indexOf('First Post');
        const secondPos = html.indexOf('Second Post');
        const thirdPos = html.indexOf('Third Post');

        // First Post (Jan 15) should appear before Second Post (Jan 10)
        expect(firstPos).toBeLessThan(secondPos);
        // Second Post (Jan 10) should appear before Third Post (Jan 5)
        expect(secondPos).toBeLessThan(thirdPos);
      });
    });

    describe('edge cases', () => {
      it('should handle empty posts array', () => {
        const html = generateArchiveHTML([], siteConfig);

        expect(html).toContain('<h1 class="archive-title">My Blog</h1>');
        expect(html).toContain('class="post-list"');
        // Should still be valid HTML
        expect(html).toContain('<!DOCTYPE html>');
      });

      it('should handle single post', () => {
        const html = generateArchiveHTML([samplePosts[0]], siteConfig);

        expect(html).toContain('First Post');
        expect(html).not.toContain('Second Post');
      });

      it('should escape HTML in titles', () => {
        const postWithHtml = {
          id: '5',
          title: 'Post with <script>alert("xss")</script> in title',
          slug: 'xss-post',
          content: { blocks: [] },
          publishedAt: Date.now(),
          status: 'published'
        };

        const html = generateArchiveHTML([postWithHtml], siteConfig);

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
      });

      it('should escape HTML in archive title', () => {
        const xssConfig = {
          ...siteConfig,
          archiveTitle: '<script>alert("xss")</script>'
        };

        const html = generateArchiveHTML(samplePosts, xssConfig);

        expect(html).not.toContain('<script>alert');
      });

      it('should handle posts without publishedAt (use current time)', () => {
        const draftPost = {
          id: '6',
          title: 'Draft Post',
          slug: 'draft-post',
          content: { blocks: [] },
          publishedAt: null,
          updatedAt: new Date('2026-01-12').getTime(),
          status: 'draft'
        };

        const html = generateArchiveHTML([draftPost], siteConfig);

        expect(html).toContain('Draft Post');
        // Should use updatedAt as fallback
        expect(html).toContain('January 12, 2026');
      });
    });
  });

  describe('formatArchiveDate', () => {
    it('should format timestamp to readable date', () => {
      const timestamp = new Date('2026-01-15').getTime();
      expect(formatArchiveDate(timestamp)).toBe('January 15, 2026');
    });

    it('should handle different months', () => {
      expect(formatArchiveDate(new Date('2026-03-01').getTime())).toBe('March 1, 2026');
      expect(formatArchiveDate(new Date('2026-12-25').getTime())).toBe('December 25, 2026');
    });

    it('should return ISO date for datetime attribute', () => {
      const timestamp = new Date('2026-01-15').getTime();
      expect(formatArchiveDate(timestamp, { iso: true })).toBe('2026-01-15');
    });
  });
});
