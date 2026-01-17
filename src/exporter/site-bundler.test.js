import { describe, it, expect, beforeEach, vi } from 'vitest';
import JSZip from 'jszip';
import { createSiteBundle } from './site-bundler.js';

// Mock the storage and image functions
vi.mock('../core/storage.js', () => ({
  getSite: vi.fn(),
  getPostsBySite: vi.fn(),
}));

vi.mock('../core/image-storage.js', () => ({
  getImagesByPost: vi.fn(),
}));

vi.mock('../utils/image-optimizer.js', () => ({
  optimizeImage: vi.fn((blob) => Promise.resolve(blob)),
}));

import { getSite, getPostsBySite } from '../core/storage.js';
import { getImagesByPost } from '../core/image-storage.js';

describe('Site Bundler', () => {
  const mockSite = {
    id: 'site-1',
    name: 'My Blog',
    archiveTitle: 'Welcome to My Blog',
    archiveTemplate: 'simple-list',
    archiveTheme: 'minimal',
  };

  const mockPosts = [
    {
      id: 'post-1',
      title: 'First Post',
      slug: 'first-post',
      content: { blocks: [{ type: 'paragraph', data: { text: 'Content of first post.' } }] },
      theme: 'minimal',
      publishedAt: new Date('2026-01-15').getTime(),
      status: 'published',
    },
    {
      id: 'post-2',
      title: 'Second Post',
      slug: 'second-post',
      content: { blocks: [{ type: 'paragraph', data: { text: 'Content of second post.' } }] },
      theme: 'modern',
      publishedAt: new Date('2026-01-10').getTime(),
      status: 'published',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getSite.mockResolvedValue(mockSite);
    getPostsBySite.mockResolvedValue(mockPosts);
    getImagesByPost.mockResolvedValue([]);
  });

  describe('createSiteBundle', () => {
    it('should return a valid ZIP blob', async () => {
      const blob = await createSiteBundle('site-1');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/zip');
    });

    it('should throw error if site not found', async () => {
      getSite.mockResolvedValue(null);

      await expect(createSiteBundle('non-existent')).rejects.toThrow('Site not found');
    });

    it('should include archive page at root', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      expect(zip.files['index.html']).toBeDefined();

      const archiveHTML = await zip.files['index.html'].async('string');
      expect(archiveHTML).toContain('Welcome to My Blog');
      expect(archiveHTML).toContain('First Post');
      expect(archiveHTML).toContain('Second Post');
    });

    it('should include each post in its own directory', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      expect(zip.files['first-post/index.html']).toBeDefined();
      expect(zip.files['second-post/index.html']).toBeDefined();
    });

    it('should render post content correctly', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      const firstPostHTML = await zip.files['first-post/index.html'].async('string');
      expect(firstPostHTML).toContain('First Post');
      expect(firstPostHTML).toContain('Content of first post.');

      const secondPostHTML = await zip.files['second-post/index.html'].async('string');
      expect(secondPostHTML).toContain('Second Post');
      expect(secondPostHTML).toContain('Content of second post.');
    });

    it('should include archive CSS file', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      expect(zip.files['css/archive.css']).toBeDefined();

      const archiveCSS = await zip.files['css/archive.css'].async('string');
      expect(archiveCSS).toContain('archive-content');
    });

    it('should include post theme CSS files', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      // Should have base CSS for posts
      expect(zip.files['css/post-base.css']).toBeDefined();

      // Should have theme CSS for each theme used
      expect(zip.files['css/post-minimal.css']).toBeDefined();
      expect(zip.files['css/post-modern.css']).toBeDefined();
    });

    it('should link posts to correct CSS files', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      const firstPostHTML = await zip.files['first-post/index.html'].async('string');
      expect(firstPostHTML).toContain('href="../css/post-base.css"');
      expect(firstPostHTML).toContain('href="../css/post-minimal.css"');

      const secondPostHTML = await zip.files['second-post/index.html'].async('string');
      expect(secondPostHTML).toContain('href="../css/post-base.css"');
      expect(secondPostHTML).toContain('href="../css/post-modern.css"');
    });

    it('should link archive to correct CSS file', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      const archiveHTML = await zip.files['index.html'].async('string');
      expect(archiveHTML).toContain('href="./css/archive.css"');
    });

    it('should handle per-post themes correctly', async () => {
      const postsWithDifferentThemes = [
        { ...mockPosts[0], theme: 'minimal' },
        { ...mockPosts[1], theme: 'modern' },
      ];
      getPostsBySite.mockResolvedValue(postsWithDifferentThemes);

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      // Both theme files should be included
      expect(zip.files['css/post-minimal.css']).toBeDefined();
      expect(zip.files['css/post-modern.css']).toBeDefined();
    });

    it('should only include CSS for themes that are used', async () => {
      const postsAllMinimal = [
        { ...mockPosts[0], theme: 'minimal' },
        { ...mockPosts[1], theme: 'minimal' },
      ];
      getPostsBySite.mockResolvedValue(postsAllMinimal);

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      expect(zip.files['css/post-minimal.css']).toBeDefined();
      expect(zip.files['css/post-modern.css']).toBeUndefined();
    });
  });

  describe('image handling', () => {
    it('should consolidate images from all posts into images/ directory', async () => {
      const mockImage1 = {
        id: 'img-1',
        filename: 'photo1.jpg',
        file: new Blob(['image1'], { type: 'image/jpeg' }),
      };
      const mockImage2 = {
        id: 'img-2',
        filename: 'photo2.png',
        file: new Blob(['image2'], { type: 'image/png' }),
      };

      getImagesByPost.mockImplementation((postId) => {
        if (postId === 'post-1') return Promise.resolve([mockImage1]);
        if (postId === 'post-2') return Promise.resolve([mockImage2]);
        return Promise.resolve([]);
      });

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      expect(zip.files['images/photo1.webp']).toBeDefined();
      expect(zip.files['images/photo2.webp']).toBeDefined();
    });

    it('should update image paths in posts to use shared images directory', async () => {
      const mockImage = {
        id: 'img-1',
        filename: 'photo.jpg',
        file: new Blob(['image'], { type: 'image/jpeg' }),
      };

      const postWithImage = {
        ...mockPosts[0],
        content: {
          blocks: [{
            type: 'image',
            data: {
              file: { url: 'blob:url', imageId: 'img-1', filename: 'photo.jpg' },
              caption: 'A photo',
            },
          }],
        },
      };

      getPostsBySite.mockResolvedValue([postWithImage]);
      getImagesByPost.mockResolvedValue([mockImage]);

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      const postHTML = await zip.files['first-post/index.html'].async('string');
      // Path should be relative from post directory to images directory
      expect(postHTML).toContain('src="../images/photo.webp"');
    });
  });

  describe('archive templates', () => {
    it('should use simple-list template by default', async () => {
      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      const archiveHTML = await zip.files['index.html'].async('string');
      expect(archiveHTML).not.toContain('class="post-excerpt"');
    });

    it('should use list-with-excerpts template when configured', async () => {
      getSite.mockResolvedValue({
        ...mockSite,
        archiveTemplate: 'list-with-excerpts',
      });

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      const archiveHTML = await zip.files['index.html'].async('string');
      expect(archiveHTML).toContain('class="post-excerpt"');
      expect(archiveHTML).toContain('Content of first post.');
    });
  });

  describe('edge cases', () => {
    it('should handle site with no posts', async () => {
      getPostsBySite.mockResolvedValue([]);

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      // Should still have archive page
      expect(zip.files['index.html']).toBeDefined();
      const archiveHTML = await zip.files['index.html'].async('string');
      expect(archiveHTML).toContain('Welcome to My Blog');
    });

    it('should handle single post', async () => {
      getPostsBySite.mockResolvedValue([mockPosts[0]]);

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      expect(zip.files['index.html']).toBeDefined();
      expect(zip.files['first-post/index.html']).toBeDefined();
      expect(zip.files['second-post/index.html']).toBeUndefined();
    });

    it('should handle posts with null/undefined theme (use default)', async () => {
      const postWithNoTheme = {
        ...mockPosts[0],
        theme: null,
      };
      getPostsBySite.mockResolvedValue([postWithNoTheme]);

      const blob = await createSiteBundle('site-1');
      const zip = await JSZip.loadAsync(blob);

      // Should fall back to minimal theme
      expect(zip.files['css/post-minimal.css']).toBeDefined();
    });
  });
});
