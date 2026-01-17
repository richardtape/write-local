import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/mocks/server.js';
import { mockSites, mockDeploy, netlifyErrorHandlers } from '../../tests/mocks/handlers.js';
import {
  listSites,
  createSiteWithDeploy,
  deployToSite,
  getDeployStatus,
  waitForDeployReady,
} from './netlify-api.js';

const TEST_TOKEN = 'test-access-token';

describe('Netlify API Client', () => {
  describe('listSites', () => {
    it('returns array of user sites', async () => {
      const sites = await listSites(TEST_TOKEN);

      expect(Array.isArray(sites)).toBe(true);
      expect(sites.length).toBe(2);
      expect(sites[0].name).toBe('my-blog');
      expect(sites[1].name).toBe('another-site');
    });

    it('handles 401 unauthorized', async () => {
      server.use(netlifyErrorHandlers.unauthorized);

      await expect(listSites(TEST_TOKEN)).rejects.toThrow('Unauthorized');
    });

    it('includes site URLs and IDs', async () => {
      const sites = await listSites(TEST_TOKEN);

      expect(sites[0]).toHaveProperty('id');
      expect(sites[0]).toHaveProperty('url');
      expect(sites[0]).toHaveProperty('ssl_url');
    });
  });

  describe('createSiteWithDeploy', () => {
    it('creates new site with ZIP deploy', async () => {
      const zipBlob = new Blob(['test content'], { type: 'application/zip' });

      const result = await createSiteWithDeploy(TEST_TOKEN, zipBlob);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('deploy');
      expect(result.deploy).toHaveProperty('id');
    });

    it('handles rate limiting', async () => {
      server.use(netlifyErrorHandlers.rateLimited);

      const zipBlob = new Blob(['test'], { type: 'application/zip' });

      await expect(createSiteWithDeploy(TEST_TOKEN, zipBlob)).rejects.toThrow('Rate limit');
    });

    it('handles server errors', async () => {
      server.use(netlifyErrorHandlers.serverError);

      const zipBlob = new Blob(['test'], { type: 'application/zip' });

      await expect(createSiteWithDeploy(TEST_TOKEN, zipBlob)).rejects.toThrow();
    });
  });

  describe('deployToSite', () => {
    it('deploys to existing site', async () => {
      const zipBlob = new Blob(['test content'], { type: 'application/zip' });
      const siteId = 'site-abc123';

      const result = await deployToSite(TEST_TOKEN, siteId, zipBlob);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('state');
      expect(result.site_id).toBe(siteId);
    });

    it('returns deploy ID for status polling', async () => {
      const zipBlob = new Blob(['test'], { type: 'application/zip' });

      const result = await deployToSite(TEST_TOKEN, 'site-abc123', zipBlob);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });
  });

  describe('getDeployStatus', () => {
    it('returns current deploy state', async () => {
      const result = await getDeployStatus(TEST_TOKEN, 'deploy-xyz789');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('state');
      expect(result.state).toBe('ready');
    });

    it('includes deploy URL when ready', async () => {
      const result = await getDeployStatus(TEST_TOKEN, 'deploy-xyz789');

      expect(result).toHaveProperty('deploy_ssl_url');
    });
  });

  describe('waitForDeployReady', () => {
    it('resolves when deploy state is ready', async () => {
      const result = await waitForDeployReady(TEST_TOKEN, 'deploy-xyz789', {
        pollInterval: 10,
        maxAttempts: 3,
      });

      expect(result.state).toBe('ready');
      expect(result).toHaveProperty('deploy_ssl_url');
    });

    it('polls multiple times for uploading state', async () => {
      let callCount = 0;
      server.use(
        http.get('https://api.netlify.com/api/v1/deploys/:deployId', () => {
          callCount++;
          // Return uploading for first 2 calls, ready on 3rd
          const state = callCount < 3 ? 'uploading' : 'ready';
          return HttpResponse.json({
            id: 'deploy-test',
            state,
            deploy_ssl_url: 'https://test.netlify.app',
          });
        })
      );

      const result = await waitForDeployReady(TEST_TOKEN, 'deploy-test', {
        pollInterval: 10,
        maxAttempts: 5,
      });

      expect(callCount).toBeGreaterThanOrEqual(3);
      expect(result.state).toBe('ready');
    });

    it('throws on deploy failure', async () => {
      server.use(netlifyErrorHandlers.deployFailed);

      await expect(
        waitForDeployReady(TEST_TOKEN, 'deploy-fail', {
          pollInterval: 10,
          maxAttempts: 3,
        })
      ).rejects.toThrow('Deploy failed');
    });

    it('throws on timeout after max attempts', async () => {
      server.use(
        http.get('https://api.netlify.com/api/v1/deploys/:deployId', () => {
          return HttpResponse.json({
            id: 'deploy-slow',
            state: 'uploading', // Never becomes ready
          });
        })
      );

      await expect(
        waitForDeployReady(TEST_TOKEN, 'deploy-slow', {
          pollInterval: 10,
          maxAttempts: 3,
        })
      ).rejects.toThrow('timed out');
    });
  });
});
