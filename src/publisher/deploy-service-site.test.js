import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishSiteToNetlify } from './deploy-service.js';

// Mock dependencies
vi.mock('../exporter/site-bundler.js', () => ({
  createSiteBundle: vi.fn(() => Promise.resolve(new Blob(['zip content'], { type: 'application/zip' }))),
}));

vi.mock('./auth-storage.js', () => ({
  getToken: vi.fn(() => Promise.resolve({ accessToken: 'test-token' })),
}));

vi.mock('./netlify-api.js', () => ({
  createSiteWithDeploy: vi.fn(() => Promise.resolve({
    id: 'netlify-site-123',
    name: 'my-blog',
    ssl_url: 'https://my-blog.netlify.app',
    deploy: {
      id: 'deploy-123',
      state: 'ready',
      deploy_ssl_url: 'https://my-blog.netlify.app',
    },
  })),
  deployToSite: vi.fn(() => Promise.resolve({
    id: 'deploy-456',
    state: 'ready',
    deploy_ssl_url: 'https://existing-site.netlify.app',
  })),
  waitForDeployReady: vi.fn(() => Promise.resolve({
    id: 'deploy-123',
    state: 'ready',
    deploy_ssl_url: 'https://my-blog.netlify.app',
  })),
}));

vi.mock('../core/storage.js', () => ({
  getSite: vi.fn(() => Promise.resolve({
    id: 'site-1',
    name: 'My Blog',
    archiveTitle: 'Welcome',
    archiveTemplate: 'simple-list',
    archiveTheme: 'minimal',
    platform: null,
    platformSiteId: null,
    platformUrl: null,
  })),
  updateSite: vi.fn(() => Promise.resolve()),
  getPostsBySite: vi.fn(() => Promise.resolve([
    { id: 'post-1', title: 'First Post', status: 'published' },
    { id: 'post-2', title: 'Second Post', status: 'published' },
  ])),
}));

import { createSiteBundle } from '../exporter/site-bundler.js';
import { getToken } from './auth-storage.js';
import { createSiteWithDeploy, deployToSite, waitForDeployReady } from './netlify-api.js';
import { getSite, updateSite, getPostsBySite } from '../core/storage.js';

describe('Deploy Service - Site Publishing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publishSiteToNetlify', () => {
    it('should check authentication', async () => {
      await publishSiteToNetlify('site-1');

      expect(getToken).toHaveBeenCalledWith('netlify');
    });

    it('should throw if not authenticated', async () => {
      getToken.mockResolvedValueOnce(null);

      await expect(publishSiteToNetlify('site-1')).rejects.toThrow('Not authenticated');
    });

    it('should get the site from storage', async () => {
      await publishSiteToNetlify('site-1');

      expect(getSite).toHaveBeenCalledWith('site-1');
    });

    it('should throw if site not found', async () => {
      getSite.mockResolvedValueOnce(null);

      await expect(publishSiteToNetlify('site-1')).rejects.toThrow('Site not found');
    });

    it('should check for published posts', async () => {
      await publishSiteToNetlify('site-1');

      expect(getPostsBySite).toHaveBeenCalledWith('site-1', { status: 'published' });
    });

    it('should throw if no published posts', async () => {
      getPostsBySite.mockResolvedValueOnce([]);

      await expect(publishSiteToNetlify('site-1')).rejects.toThrow('No published posts');
    });

    it('should generate site bundle', async () => {
      await publishSiteToNetlify('site-1');

      expect(createSiteBundle).toHaveBeenCalledWith('site-1');
    });

    it('should create new Netlify site if site has no platformSiteId', async () => {
      await publishSiteToNetlify('site-1');

      expect(createSiteWithDeploy).toHaveBeenCalled();
    });

    it('should deploy to existing Netlify site if site has platformSiteId', async () => {
      getSite.mockResolvedValueOnce({
        id: 'site-1',
        name: 'My Blog',
        platform: 'netlify',
        platformSiteId: 'existing-netlify-site',
        platformUrl: 'https://existing.netlify.app',
      });

      await publishSiteToNetlify('site-1');

      expect(deployToSite).toHaveBeenCalled();
      expect(createSiteWithDeploy).not.toHaveBeenCalled();
    });

    it('should update site with Netlify details after first deploy', async () => {
      await publishSiteToNetlify('site-1');

      expect(updateSite).toHaveBeenCalledWith('site-1', expect.objectContaining({
        platform: 'netlify',
        platformSiteId: 'netlify-site-123',
        platformUrl: 'https://my-blog.netlify.app',
      }));
    });

    it('should update lastPublishedAt timestamp', async () => {
      await publishSiteToNetlify('site-1');

      expect(updateSite).toHaveBeenCalledWith('site-1', expect.objectContaining({
        lastPublishedAt: expect.any(Number),
      }));
    });

    it('should return success with URL', async () => {
      const result = await publishSiteToNetlify('site-1');

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://my-blog.netlify.app');
    });

    it('should call onProgress callback', async () => {
      const onProgress = vi.fn();

      await publishSiteToNetlify('site-1', { onProgress });

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress.mock.calls.some(call => call[0].message.includes('bundle'))).toBe(true);
    });

    it('should not update platform details on subsequent deploys', async () => {
      getSite.mockResolvedValueOnce({
        id: 'site-1',
        name: 'My Blog',
        platform: 'netlify',
        platformSiteId: 'existing-netlify-site',
        platformUrl: 'https://existing.netlify.app',
      });

      await publishSiteToNetlify('site-1');

      // Should only update lastPublishedAt, not overwrite existing platform details
      expect(updateSite).toHaveBeenCalledWith('site-1', expect.objectContaining({
        lastPublishedAt: expect.any(Number),
      }));
      // Should not change the platformUrl if it's already set
      expect(updateSite).not.toHaveBeenCalledWith('site-1', expect.objectContaining({
        platformSiteId: expect.any(String),
      }));
    });
  });
});
