import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  createSite,
  getSite,
  updateSite,
  deleteSite,
  listSites,
  getPostsBySite,
  createPost,
  updatePost
} from './storage.js';

describe('Storage - Sites', () => {
  // Clean database before each test
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  describe('Site CRUD Operations', () => {
    it('should create a site with default values', async () => {
      const site = await createSite({
        name: 'My Blog',
      });

      expect(site.id).toBeDefined();
      expect(site.name).toBe('My Blog');
      // Default values
      expect(site.archiveTitle).toBe('My Blog'); // Defaults to name
      expect(site.archiveTemplate).toBe('simple-list');
      expect(site.archiveTheme).toBe('minimal');
      // Platform fields should be null (not deployed yet)
      expect(site.platform).toBeNull();
      expect(site.platformSiteId).toBeNull();
      expect(site.platformUrl).toBeNull();
      // Timestamps
      expect(site.createdAt).toBeDefined();
      expect(site.updatedAt).toBeDefined();
      expect(site.lastPublishedAt).toBeNull();
    });

    it('should create a site with custom archive settings', async () => {
      const site = await createSite({
        name: 'Custom Blog',
        archiveTitle: 'Welcome to My World',
        archiveTemplate: 'list-with-excerpts',
        archiveTheme: 'modern',
      });

      expect(site.name).toBe('Custom Blog');
      expect(site.archiveTitle).toBe('Welcome to My World');
      expect(site.archiveTemplate).toBe('list-with-excerpts');
      expect(site.archiveTheme).toBe('modern');
    });

    it('should retrieve a site by ID', async () => {
      const created = await createSite({ name: 'Test Site' });

      const retrieved = await getSite(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Site');
    });

    it('should return undefined for non-existent site', async () => {
      const site = await getSite('non-existent-id');
      expect(site).toBeUndefined();
    });

    it('should update site fields', async () => {
      const site = await createSite({ name: 'Original Name' });
      const originalUpdatedAt = site.updatedAt;

      // Wait to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await updateSite(site.id, {
        name: 'Updated Name',
        archiveTitle: 'New Archive Title',
        archiveTemplate: 'list-with-excerpts',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.archiveTitle).toBe('New Archive Title');
      expect(updated.archiveTemplate).toBe('list-with-excerpts');
      expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);

      // Verify persistence
      const retrieved = await getSite(site.id);
      expect(retrieved.name).toBe('Updated Name');
    });

    it('should update only specified fields', async () => {
      const site = await createSite({
        name: 'My Blog',
        archiveTitle: 'Welcome',
        archiveTemplate: 'simple-list',
      });

      const updated = await updateSite(site.id, {
        archiveTitle: 'New Title',
      });

      expect(updated.name).toBe('My Blog'); // Unchanged
      expect(updated.archiveTemplate).toBe('simple-list'); // Unchanged
      expect(updated.archiveTitle).toBe('New Title'); // Updated
    });

    it('should throw error when updating non-existent site', async () => {
      await expect(
        updateSite('non-existent-id', { name: 'Test' })
      ).rejects.toThrow();
    });

    it('should delete a site', async () => {
      const site = await createSite({ name: 'To Delete' });

      await deleteSite(site.id);

      const retrieved = await getSite(site.id);
      expect(retrieved).toBeUndefined();
    });

    it('should list all sites', async () => {
      await createSite({ name: 'Site 1' });
      await createSite({ name: 'Site 2' });
      await createSite({ name: 'Site 3' });

      const sites = await listSites();

      expect(sites).toHaveLength(3);
    });

    it('should list sites sorted by most recently updated first', async () => {
      const site1 = await createSite({ name: 'First Site' });
      await new Promise(resolve => setTimeout(resolve, 10));

      const site2 = await createSite({ name: 'Second Site' });
      await new Promise(resolve => setTimeout(resolve, 10));

      const site3 = await createSite({ name: 'Third Site' });

      const sites = await listSites();

      expect(sites[0].name).toBe('Third Site');
      expect(sites[1].name).toBe('Second Site');
      expect(sites[2].name).toBe('First Site');
    });

    it('should return empty array when no sites exist', async () => {
      const sites = await listSites();
      expect(sites).toHaveLength(0);
    });
  });

  describe('Platform Deployment Fields', () => {
    it('should update platform deployment details', async () => {
      const site = await createSite({ name: 'My Blog' });

      // Simulate deployment to Netlify
      const updated = await updateSite(site.id, {
        platform: 'netlify',
        platformSiteId: 'netlify-site-123',
        platformUrl: 'https://my-blog.netlify.app',
        lastPublishedAt: Date.now(),
      });

      expect(updated.platform).toBe('netlify');
      expect(updated.platformSiteId).toBe('netlify-site-123');
      expect(updated.platformUrl).toBe('https://my-blog.netlify.app');
      expect(updated.lastPublishedAt).toBeDefined();
    });

    it('should support different platforms', async () => {
      // Netlify site
      const netlifySite = await createSite({ name: 'Netlify Blog' });
      await updateSite(netlifySite.id, {
        platform: 'netlify',
        platformSiteId: 'netlify-123',
        platformUrl: 'https://blog.netlify.app',
      });

      // Vercel site (future)
      const vercelSite = await createSite({ name: 'Vercel Blog' });
      await updateSite(vercelSite.id, {
        platform: 'vercel',
        platformSiteId: 'vercel-456',
        platformUrl: 'https://blog.vercel.app',
      });

      // GitHub Pages site (future)
      const githubSite = await createSite({ name: 'GitHub Blog' });
      await updateSite(githubSite.id, {
        platform: 'github',
        platformSiteId: 'user/repo',
        platformUrl: 'https://user.github.io/repo',
      });

      const sites = await listSites();
      const platforms = sites.map(s => s.platform);

      expect(platforms).toContain('netlify');
      expect(platforms).toContain('vercel');
      expect(platforms).toContain('github');
    });

    it('should allow site to exist without platform (not deployed)', async () => {
      const site = await createSite({ name: 'Local Only Blog' });

      // Site exists but has no platform deployment
      expect(site.platform).toBeNull();
      expect(site.platformSiteId).toBeNull();
      expect(site.platformUrl).toBeNull();
      expect(site.lastPublishedAt).toBeNull();

      // Can still configure archive settings
      const updated = await updateSite(site.id, {
        archiveTitle: 'My Local Blog',
        archiveTemplate: 'list-with-excerpts',
      });

      expect(updated.archiveTitle).toBe('My Local Blog');
      expect(updated.platform).toBeNull(); // Still not deployed
    });
  });

  describe('Site-Post Relationship', () => {
    it('should get posts belonging to a site', async () => {
      const site = await createSite({ name: 'My Blog' });

      // Create posts linked to the site
      const post1 = await createPost({ title: 'Post 1', content: [] });
      await updatePost(post1.id, { siteId: site.id });

      const post2 = await createPost({ title: 'Post 2', content: [] });
      await updatePost(post2.id, { siteId: site.id });

      // Create a post NOT linked to the site
      await createPost({ title: 'Unlinked Post', content: [] });

      const sitePosts = await getPostsBySite(site.id);

      expect(sitePosts).toHaveLength(2);
      expect(sitePosts.map(p => p.title)).toContain('Post 1');
      expect(sitePosts.map(p => p.title)).toContain('Post 2');
      expect(sitePosts.map(p => p.title)).not.toContain('Unlinked Post');
    });

    it('should get published posts for a site', async () => {
      const site = await createSite({ name: 'My Blog' });

      // Create posts with different statuses
      const draft = await createPost({ title: 'Draft Post', content: [] });
      await updatePost(draft.id, { siteId: site.id });

      const published1 = await createPost({ title: 'Published 1', content: [] });
      await updatePost(published1.id, { siteId: site.id, status: 'published', publishedAt: Date.now() });

      const published2 = await createPost({ title: 'Published 2', content: [] });
      await updatePost(published2.id, { siteId: site.id, status: 'published', publishedAt: Date.now() });

      const publishedPosts = await getPostsBySite(site.id, { status: 'published' });

      expect(publishedPosts).toHaveLength(2);
      expect(publishedPosts.every(p => p.status === 'published')).toBe(true);
    });

    it('should return posts sorted by publishedAt descending', async () => {
      const site = await createSite({ name: 'My Blog' });

      // Create posts with different publish times
      const post1 = await createPost({ title: 'First Published', content: [] });
      await updatePost(post1.id, { siteId: site.id, status: 'published', publishedAt: 1000 });

      const post2 = await createPost({ title: 'Second Published', content: [] });
      await updatePost(post2.id, { siteId: site.id, status: 'published', publishedAt: 2000 });

      const post3 = await createPost({ title: 'Third Published', content: [] });
      await updatePost(post3.id, { siteId: site.id, status: 'published', publishedAt: 3000 });

      const posts = await getPostsBySite(site.id, { status: 'published' });

      // Most recently published first
      expect(posts[0].title).toBe('Third Published');
      expect(posts[1].title).toBe('Second Published');
      expect(posts[2].title).toBe('First Published');
    });

    it('should return empty array when site has no posts', async () => {
      const site = await createSite({ name: 'Empty Blog' });

      const posts = await getPostsBySite(site.id);

      expect(posts).toHaveLength(0);
    });

    it('should exclude trashed posts from site posts by default', async () => {
      const site = await createSite({ name: 'My Blog' });

      const activePost = await createPost({ title: 'Active Post', content: [] });
      await updatePost(activePost.id, { siteId: site.id });

      const trashedPost = await createPost({ title: 'Trashed Post', content: [] });
      await updatePost(trashedPost.id, { siteId: site.id, status: 'trashed' });

      const posts = await getPostsBySite(site.id);

      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Active Post');
    });

    it('should allow post to be unlinked from site', async () => {
      const site = await createSite({ name: 'My Blog' });

      const post = await createPost({ title: 'My Post', content: [] });
      await updatePost(post.id, { siteId: site.id });

      // Verify linked
      let sitePosts = await getPostsBySite(site.id);
      expect(sitePosts).toHaveLength(1);

      // Unlink the post
      await updatePost(post.id, { siteId: null });

      // Verify unlinked
      sitePosts = await getPostsBySite(site.id);
      expect(sitePosts).toHaveLength(0);
    });
  });
});
