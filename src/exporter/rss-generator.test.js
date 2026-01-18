import { describe, it, expect } from 'vitest';
import { formatRFC822Date, generateRSSFeed } from './rss-generator.js';

describe('RSS Generator', () => {
  describe('formatRFC822Date', () => {
    it('formats timestamp as RFC 822 date', () => {
      // January 1, 2024, 10:00:00 UTC
      const timestamp = new Date('2024-01-01T10:00:00Z').getTime();
      const result = formatRFC822Date(timestamp);

      expect(result).toBe('Mon, 01 Jan 2024 10:00:00 GMT');
    });

    it('uses GMT timezone', () => {
      const timestamp = new Date('2024-06-15T14:30:00Z').getTime();
      const result = formatRFC822Date(timestamp);

      expect(result).toContain('GMT');
    });

    it('handles various timestamps correctly', () => {
      // Test different dates
      const testCases = [
        {
          timestamp: new Date('2024-12-25T00:00:00Z').getTime(),
          expected: 'Wed, 25 Dec 2024 00:00:00 GMT'
        },
        {
          timestamp: new Date('2025-03-15T18:45:30Z').getTime(),
          expected: 'Sat, 15 Mar 2025 18:45:30 GMT'
        }
      ];

      testCases.forEach(({ timestamp, expected }) => {
        expect(formatRFC822Date(timestamp)).toBe(expected);
      });
    });

    it('handles epoch timestamp (0)', () => {
      const result = formatRFC822Date(0);
      expect(result).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    });

    it('formats day and month with leading zeros', () => {
      // January 5, 2024 (should be "05 Jan")
      const timestamp = new Date('2024-01-05T12:00:00Z').getTime();
      const result = formatRFC822Date(timestamp);

      expect(result).toContain('05 Jan');
    });
  });

  describe('generateRSSFeed', () => {
    const siteConfig = {
      siteUrl: 'https://myblog.com',
      name: 'My Blog',
      blogDescription: 'My thoughts on web development',
      feedLanguage: 'en-us',
      feedIncludeFullContent: false,
    };

    describe('Basic RSS structure', () => {
      it('generates valid RSS 2.0 XML with XML declaration', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(result).toContain('<rss version="2.0"');
      });

      it('includes RSS namespaces (atom and content)', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
        expect(result).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
      });

      it('includes required channel elements', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<channel>');
        expect(result).toContain('</channel>');
        expect(result).toContain('</rss>');
      });
    });

    describe('Channel metadata', () => {
      it('sets channel title from site name', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<title>My Blog</title>');
      });

      it('sets channel link from siteUrl', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<link>https://myblog.com/</link>');
      });

      it('sets channel description from blogDescription', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<description>My thoughts on web development</description>');
      });

      it('sets language from feedLanguage', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<language>en-us</language>');
      });

      it('includes atom:link self-reference', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<atom:link href="https://myblog.com/feed.xml" rel="self" type="application/rss+xml"/>');
      });

      it('includes managingEditor if feedAuthor provided', () => {
        const posts = [];
        const config = {
          ...siteConfig,
          feedAuthor: 'Jane Doe (jane@example.com)'
        };
        const result = generateRSSFeed(posts, config);

        expect(result).toContain('<managingEditor>Jane Doe (jane@example.com)</managingEditor>');
      });

      it('omits managingEditor if feedAuthor is null', () => {
        const posts = [];
        const config = {
          ...siteConfig,
          feedAuthor: null
        };
        const result = generateRSSFeed(posts, config);

        expect(result).not.toContain('<managingEditor>');
      });

      it('sets lastBuildDate to most recent post publishedAt', () => {
        const posts = [
          {
            id: 'post1',
            title: 'First Post',
            slug: 'first-post',
            publishedAt: new Date('2024-01-01T10:00:00Z').getTime(),
            updatedAt: new Date('2024-01-01T10:00:00Z').getTime(),
            content: { blocks: [] },
          },
          {
            id: 'post2',
            title: 'Second Post',
            slug: 'second-post',
            publishedAt: new Date('2024-01-15T14:30:00Z').getTime(),
            updatedAt: new Date('2024-01-15T14:30:00Z').getTime(),
            content: { blocks: [] },
          }
        ];
        const result = generateRSSFeed(posts, siteConfig);

        // Most recent is 2024-01-15
        expect(result).toContain('<lastBuildDate>Mon, 15 Jan 2024 14:30:00 GMT</lastBuildDate>');
      });

      it('handles empty blogDescription', () => {
        const posts = [];
        const config = {
          ...siteConfig,
          blogDescription: ''
        };
        const result = generateRSSFeed(posts, config);

        expect(result).toContain('<description></description>');
      });
    });

    describe('Empty feed handling', () => {
      it('handles empty posts array', () => {
        const posts = [];
        const result = generateRSSFeed(posts, siteConfig);

        // Should have valid structure but no items
        expect(result).toContain('<channel>');
        expect(result).not.toContain('<item>');
      });
    });

    describe('RSS Items', () => {
      it('includes all published posts as items', () => {
        const posts = [
          {
            id: 'post1',
            title: 'First Post',
            slug: 'first-post',
            publishedAt: new Date('2024-01-01T10:00:00Z').getTime(),
            updatedAt: new Date('2024-01-01T10:00:00Z').getTime(),
            content: { blocks: [] },
          },
          {
            id: 'post2',
            title: 'Second Post',
            slug: 'second-post',
            publishedAt: new Date('2024-01-02T10:00:00Z').getTime(),
            updatedAt: new Date('2024-01-02T10:00:00Z').getTime(),
            content: { blocks: [] },
          }
        ];
        const result = generateRSSFeed(posts, siteConfig);

        // Should have 2 items
        const itemMatches = result.match(/<item>/g);
        expect(itemMatches).toHaveLength(2);
      });

      it('sorts items by publishedAt descending (newest first)', () => {
        const posts = [
          {
            id: 'post1',
            title: 'First Post',
            slug: 'first-post',
            publishedAt: new Date('2024-01-01T10:00:00Z').getTime(),
            updatedAt: new Date('2024-01-01T10:00:00Z').getTime(),
            content: { blocks: [] },
          },
          {
            id: 'post2',
            title: 'Second Post',
            slug: 'second-post',
            publishedAt: new Date('2024-01-15T10:00:00Z').getTime(),
            updatedAt: new Date('2024-01-15T10:00:00Z').getTime(),
            content: { blocks: [] },
          }
        ];
        const result = generateRSSFeed(posts, siteConfig);

        // Second post should appear first (newer)
        const firstTitleIndex = result.indexOf('<title>Second Post</title>');
        const secondTitleIndex = result.indexOf('<title>First Post</title>');
        expect(firstTitleIndex).toBeLessThan(secondTitleIndex);
      });

      it('sets item title from post title', () => {
        const posts = [{
          id: 'post1',
          title: 'My Awesome Post',
          slug: 'my-awesome-post',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<title>My Awesome Post</title>');
      });

      it('sets item link to post URL', () => {
        const posts = [{
          id: 'post1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<link>https://myblog.com/test-post/</link>');
      });

      it('sets guid to post ID with isPermaLink=false', () => {
        const posts = [{
          id: 'abc123def456',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<guid isPermaLink="false">urn:uuid:abc123def456</guid>');
      });

      it('formats guid as urn:uuid:[postId]', () => {
        const posts = [{
          id: 'my-post-id-123',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('urn:uuid:my-post-id-123');
      });

      it('formats pubDate as RFC 822', () => {
        const posts = [{
          id: 'post1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: new Date('2024-01-15T14:30:00Z').getTime(),
          updatedAt: new Date('2024-01-15T14:30:00Z').getTime(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('<pubDate>Mon, 15 Jan 2024 14:30:00 GMT</pubDate>');
      });

      it('includes atom:updated if post was modified', () => {
        const posts = [{
          id: 'post1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: new Date('2024-01-01T10:00:00Z').getTime(),
          updatedAt: new Date('2024-01-15T14:30:00Z').getTime(), // Modified later
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        // ISO 8601 with milliseconds: 2024-01-15T14:30:00.000Z
        expect(result).toMatch(/<atom:updated>2024-01-15T14:30:00(\.\d{3})?Z<\/atom:updated>/);
      });

      it('omits atom:updated if post was never modified', () => {
        const timestamp = new Date('2024-01-01T10:00:00Z').getTime();
        const posts = [{
          id: 'post1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: timestamp,
          updatedAt: timestamp, // Same as publishedAt
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).not.toContain('<atom:updated>');
      });

      it('escapes XML special characters in title', () => {
        const posts = [{
          id: 'post1',
          title: 'Post with <tags> & "quotes"',
          slug: 'post-with-tags',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        expect(result).toContain('Post with &lt;tags&gt; &amp; &quot;quotes&quot;');
      });
    });

    describe('Content modes', () => {
      const createPostWithContent = (includeFullContent = false) => ({
        id: 'post1',
        title: 'Test Post',
        slug: 'test-post',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
        content: {
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: 'This is the first paragraph with some content.'
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'This is the second paragraph with more content.'
              }
            }
          ]
        },
      });

      it('uses excerpt in description when feedIncludeFullContent=false', () => {
        const config = { ...siteConfig, feedIncludeFullContent: false };
        const posts = [createPostWithContent()];
        const result = generateRSSFeed(posts, config);

        // Should have description with excerpt
        expect(result).toContain('<description><![CDATA[');
        expect(result).toContain('This is the first paragraph');
      });

      it('includes full HTML in content:encoded when feedIncludeFullContent=true', () => {
        const config = { ...siteConfig, feedIncludeFullContent: true };
        const posts = [createPostWithContent()];
        const result = generateRSSFeed(posts, config);

        // Should have content:encoded with full HTML
        expect(result).toContain('<content:encoded><![CDATA[');
        expect(result).toContain('<p>This is the first paragraph');
        expect(result).toContain('<p>This is the second paragraph');
      });

      it('wraps HTML content in CDATA', () => {
        const config = { ...siteConfig, feedIncludeFullContent: true };
        const posts = [createPostWithContent()];
        const result = generateRSSFeed(posts, config);

        expect(result).toContain('<![CDATA[');
        expect(result).toContain(']]>');
      });

      it('handles posts with no content blocks', () => {
        const posts = [{
          id: 'post1',
          title: 'Empty Post',
          slug: 'empty-post',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: { blocks: [] },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        // Should still have description element
        expect(result).toContain('<description><![CDATA[]]></description>');
      });

      it('generates valid excerpt for description', () => {
        const posts = [{
          id: 'post1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
          content: {
            blocks: [
              {
                type: 'paragraph',
                data: {
                  text: 'Word '.repeat(60) + 'End' // More than 50 words
                }
              }
            ]
          },
        }];
        const result = generateRSSFeed(posts, siteConfig);

        // Should truncate to 50 words with ellipsis
        expect(result).toContain('...');
        // Should not have all 60 "Word" instances
        const descriptionMatch = result.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
        if (descriptionMatch) {
          const wordCount = descriptionMatch[1].split(/\s+/).filter(w => w).length;
          expect(wordCount).toBeLessThanOrEqual(51); // 50 words + "..."
        }
      });
    });
  });
});
