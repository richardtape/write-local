import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, createPost } from '../core/storage.js';
import { saveToken, deleteToken } from './auth-storage.js';
import { publishToNetlify } from './deploy-service.js';

// Mock the bundler to avoid complex setup
vi.mock('../exporter/bundler.js', () => ({
  createExportBundle: vi.fn(() => Promise.resolve(new Blob(['test zip'], { type: 'application/zip' }))),
}));

import { createExportBundle } from '../exporter/bundler.js';

describe('Deploy Service', () => {
  let testPostId;

  beforeEach(async () => {
    // Reset database
    await db.delete();
    await db.open();

    // Reset mocks
    vi.clearAllMocks();

    // Create a test post
    const post = await createPost({
      title: 'Test Post',
      content: { blocks: [{ type: 'paragraph', data: { text: 'Hello' } }] },
    });
    testPostId = post.id;

    // Save a valid token
    await saveToken('netlify', { accessToken: 'valid-token' });
  });

  describe('publishToNetlify', () => {
    it('creates new site when no siteId provided', async () => {
      const result = await publishToNetlify(testPostId);

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.siteId).toBeDefined();
    });

    it('deploys to existing site when siteId provided', async () => {
      const result = await publishToNetlify(testPostId, {
        siteId: 'site-abc123',
      });

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('calls createExportBundle with post ID', async () => {
      await publishToNetlify(testPostId);

      expect(createExportBundle).toHaveBeenCalledWith(testPostId);
    });

    it('calls onProgress callbacks', async () => {
      const onProgress = vi.fn();

      await publishToNetlify(testPostId, { onProgress });

      expect(onProgress).toHaveBeenCalled();
      // Check that progress includes status messages
      const calls = onProgress.mock.calls;
      const messages = calls.map(call => call[0].message);
      expect(messages.some(m => m.includes('Generating'))).toBe(true);
    });

    it('returns URL on success', async () => {
      const result = await publishToNetlify(testPostId);

      expect(result.success).toBe(true);
      expect(result.url).toMatch(/^https:\/\//);
    });

    it('throws when not authenticated', async () => {
      await deleteToken('netlify');

      await expect(publishToNetlify(testPostId)).rejects.toThrow('Not authenticated');
    });

    it('includes site ID in result for new sites', async () => {
      const result = await publishToNetlify(testPostId);

      expect(result.siteId).toBeDefined();
      expect(typeof result.siteId).toBe('string');
    });

    it('returns deploy ID in result', async () => {
      const result = await publishToNetlify(testPostId);

      expect(result.deployId).toBeDefined();
    });
  });
});
