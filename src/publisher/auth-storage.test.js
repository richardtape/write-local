import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../core/storage.js';
import { saveToken, getToken, deleteToken, hasToken } from './auth-storage.js';

describe('Auth Storage', () => {
  beforeEach(async () => {
    // Reset database before each test
    await db.delete();
    await db.open();
  });

  describe('saveToken', () => {
    it('stores token in IndexedDB settings', async () => {
      const tokenData = {
        accessToken: 'test-token-123',
        createdAt: Date.now(),
      };

      await saveToken('netlify', tokenData);

      // Verify it was stored
      const stored = await db.settings.get('netlifyToken');
      expect(stored).toBeDefined();
      expect(stored.value.accessToken).toBe('test-token-123');
    });

    it('overwrites existing token for same platform', async () => {
      await saveToken('netlify', { accessToken: 'old-token' });
      await saveToken('netlify', { accessToken: 'new-token' });

      const stored = await db.settings.get('netlifyToken');
      expect(stored.value.accessToken).toBe('new-token');
    });
  });

  describe('getToken', () => {
    it('retrieves stored token', async () => {
      const tokenData = {
        accessToken: 'retrieve-test-token',
        createdAt: Date.now(),
      };
      await saveToken('netlify', tokenData);

      const result = await getToken('netlify');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('retrieve-test-token');
    });

    it('returns null when no token exists', async () => {
      const result = await getToken('netlify');

      expect(result).toBeNull();
    });

    it('returns null for unknown platform', async () => {
      await saveToken('netlify', { accessToken: 'test' });

      const result = await getToken('vercel');

      expect(result).toBeNull();
    });
  });

  describe('deleteToken', () => {
    it('removes token from storage', async () => {
      await saveToken('netlify', { accessToken: 'to-delete' });

      await deleteToken('netlify');

      const result = await getToken('netlify');
      expect(result).toBeNull();
    });

    it('does not throw when deleting non-existent token', async () => {
      // Should not throw
      await expect(deleteToken('netlify')).resolves.not.toThrow();
    });
  });

  describe('hasToken', () => {
    it('returns true when token exists', async () => {
      await saveToken('netlify', { accessToken: 'exists' });

      const result = await hasToken('netlify');

      expect(result).toBe(true);
    });

    it('returns false when no token exists', async () => {
      const result = await hasToken('netlify');

      expect(result).toBe(false);
    });

    it('returns false after token is deleted', async () => {
      await saveToken('netlify', { accessToken: 'temp' });
      await deleteToken('netlify');

      const result = await hasToken('netlify');

      expect(result).toBe(false);
    });
  });
});
