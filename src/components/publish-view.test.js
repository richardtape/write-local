import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, createPost, setStatus, getPost } from '../core/storage.js';
import { saveToken, deleteToken } from '../publisher/auth-storage.js';
import { renderPublishView } from './publish-view.js';

// Mock the OAuth module
vi.mock('../publisher/netlify-oauth.js', () => ({
  generateAuthUrl: vi.fn(() => 'https://app.netlify.com/authorize?mock=true'),
  openAuthPopup: vi.fn(() => ({ closed: true })),
  handleOAuthCallback: vi.fn(() => ({ success: true, accessToken: 'mock-token' })),
  getStoredState: vi.fn(),
  clearStoredState: vi.fn(),
  REDIRECT_URI: 'https://writelocal.test/',
}));

// Mock the deploy service
vi.mock('../publisher/deploy-service.js', () => ({
  publishToNetlify: vi.fn(() =>
    Promise.resolve({
      success: true,
      url: 'https://test-site.netlify.app',
      siteId: 'site-123',
      deployId: 'deploy-456',
    })
  ),
  isAuthenticated: vi.fn(() => Promise.resolve(false)),
}));

// Mock Netlify API
vi.mock('../publisher/netlify-api.js', () => ({
  listSites: vi.fn(() =>
    Promise.resolve([
      { id: 'site-1', name: 'my-blog', url: 'https://my-blog.netlify.app' },
      { id: 'site-2', name: 'other-site', url: 'https://other-site.netlify.app' },
    ])
  ),
}));

import { publishToNetlify, isAuthenticated } from '../publisher/deploy-service.js';
import { listSites } from '../publisher/netlify-api.js';
import { generateAuthUrl, openAuthPopup } from '../publisher/netlify-oauth.js';

describe('PublishView Component', () => {
  let container;
  let mockRouter;
  let testPostId;

  beforeEach(async () => {
    // Reset database
    await db.delete();
    await db.open();

    // Reset mocks
    vi.clearAllMocks();

    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock router
    mockRouter = {
      navigate: vi.fn(),
      handleRoute: vi.fn(),
    };

    // Create a test post
    const post = await createPost({
      title: 'Test Post',
      content: { blocks: [] },
    });
    testPostId = post.id;

    // Default: not authenticated
    isAuthenticated.mockResolvedValue(false);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('rendering', () => {
    it('shows connect button when not authenticated', async () => {
      isAuthenticated.mockResolvedValue(false);

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      expect(container.textContent).toContain('Connect to Netlify');
      expect(container.querySelector('[data-action="connect-netlify"]')).not.toBeNull();
    });

    it('shows publish options when authenticated', async () => {
      isAuthenticated.mockResolvedValue(true);
      await saveToken('netlify', { accessToken: 'valid-token' });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      expect(container.textContent).toContain('Connected to Netlify');
      expect(container.querySelector('[data-action="publish"]')).not.toBeNull();
    });

    it('shows back button in header', async () => {
      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const backBtn = container.querySelector('[data-action="back"]');
      expect(backBtn).not.toBeNull();
      expect(backBtn.textContent).toContain('Back');
    });

    it('shows Publish header', async () => {
      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      expect(container.querySelector('h2').textContent).toContain('Publish');
    });
  });

  describe('navigation', () => {
    it('back button navigates to /posts', async () => {
      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const backBtn = container.querySelector('[data-action="back"]');
      backBtn.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith('/posts');
    });
  });

  describe('connect flow', () => {
    it('connect button triggers OAuth popup', async () => {
      isAuthenticated.mockResolvedValue(false);

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const connectBtn = container.querySelector('[data-action="connect-netlify"]');
      connectBtn.click();

      expect(generateAuthUrl).toHaveBeenCalled();
      expect(openAuthPopup).toHaveBeenCalled();
    });
  });

  describe('disconnect flow', () => {
    it('disconnect button removes token', async () => {
      isAuthenticated.mockResolvedValue(true);
      await saveToken('netlify', { accessToken: 'valid-token' });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const disconnectBtn = container.querySelector('[data-action="disconnect"]');
      disconnectBtn.click();

      // Wait for re-render to show connect button
      await vi.waitFor(() => {
        expect(container.textContent).toContain('Connect to Netlify');
      }, { timeout: 1000 });
    });
  });

  describe('site selection', () => {
    it('loads existing sites when authenticated', async () => {
      isAuthenticated.mockResolvedValue(true);
      await saveToken('netlify', { accessToken: 'valid-token' });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      expect(listSites).toHaveBeenCalled();
      const select = container.querySelector('#netlify-site-select');
      expect(select).not.toBeNull();
    });

    it('shows create new option in site selector', async () => {
      isAuthenticated.mockResolvedValue(true);
      await saveToken('netlify', { accessToken: 'valid-token' });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const select = container.querySelector('#netlify-site-select');
      const options = select.querySelectorAll('option');
      const newOption = Array.from(options).find(o => o.value === 'new');
      expect(newOption).not.toBeNull();
      expect(newOption.textContent).toContain('Create new site');
    });

    it('lists existing sites in selector', async () => {
      isAuthenticated.mockResolvedValue(true);
      await saveToken('netlify', { accessToken: 'valid-token' });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const select = container.querySelector('#netlify-site-select');
      expect(select.innerHTML).toContain('my-blog');
      expect(select.innerHTML).toContain('other-site');
    });
  });

  describe('publish flow', () => {
    beforeEach(async () => {
      isAuthenticated.mockResolvedValue(true);
      await saveToken('netlify', { accessToken: 'valid-token' });
    });

    it('publish button triggers deployment', async () => {
      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      // Wait for publishToNetlify to be called
      await vi.waitFor(() => {
        expect(publishToNetlify).toHaveBeenCalledWith(testPostId, expect.any(Object));
      }, { timeout: 1000 });
    });

    it('shows progress during publishing', async () => {
      publishToNetlify.mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve({
          success: true,
          url: 'https://test.netlify.app',
        }), 100));
      });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      // Should show publishing state
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(container.textContent).toMatch(/Publishing|Uploading|Generating/i);
    });

    it('shows URL on success', async () => {
      // Reset mock to ensure consistent behavior
      publishToNetlify.mockResolvedValue({
        success: true,
        url: 'https://my-site.netlify.app',
        siteId: 'site-123',
        deployId: 'deploy-456',
      });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      // Wait for publish to complete - need to wait for multiple async operations
      // (click handler -> startPublishing -> publishToNetlify -> DOM update)
      await vi.waitFor(() => {
        expect(container.textContent).toContain('Published');
        expect(container.querySelector('a.site-url')).not.toBeNull();
      }, { timeout: 1000 });

      // Verify the URL is a valid Netlify URL
      const link = container.querySelector('a.site-url');
      expect(link.href).toContain('netlify.app');
    });

    it('marks post as published on success', async () => {
      publishToNetlify.mockResolvedValue({
        success: true,
        url: 'https://my-site.netlify.app',
        siteId: 'site-123',
        deployId: 'deploy-456',
      });

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      // Verify post starts as draft
      let post = await getPost(testPostId);
      expect(post.status).toBe('draft');

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      // Wait for publish to complete
      await vi.waitFor(() => {
        expect(container.textContent).toContain('Published');
      }, { timeout: 1000 });

      // Verify post is now published
      post = await getPost(testPostId);
      expect(post.status).toBe('published');
      expect(post.publishedAt).not.toBeNull();
    });

    it('shows error message on failure', async () => {
      publishToNetlify.mockRejectedValue(new Error('Deploy failed: test error'));

      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      // Wait for error state to appear
      await vi.waitFor(() => {
        expect(container.textContent).toContain('failed');
      }, { timeout: 1000 });
    });

    it('passes siteId when existing site selected', async () => {
      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      // Select existing site
      const select = container.querySelector('#netlify-site-select');
      select.value = 'site-1';

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      await vi.waitFor(() => {
        expect(publishToNetlify).toHaveBeenCalledWith(
          testPostId,
          expect.objectContaining({ siteId: 'site-1' })
        );
      }, { timeout: 1000 });
    });

    it('passes null siteId when creating new site', async () => {
      await renderPublishView(container, { router: mockRouter, postId: testPostId });

      // Select "create new"
      const select = container.querySelector('#netlify-site-select');
      select.value = 'new';

      const publishBtn = container.querySelector('[data-action="publish"]');
      publishBtn.click();

      await vi.waitFor(() => {
        expect(publishToNetlify).toHaveBeenCalledWith(
          testPostId,
          expect.objectContaining({ siteId: null })
        );
      }, { timeout: 1000 });
    });
  });

  describe('no post selected', () => {
    it('shows message when no post ID provided', async () => {
      await renderPublishView(container, { router: mockRouter, postId: null });

      expect(container.textContent).toContain('No post selected');
    });
  });
});
