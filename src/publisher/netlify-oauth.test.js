import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../core/storage.js';
import {
  generateAuthUrl,
  handleOAuthCallback,
  getStoredState,
  clearStoredState,
  NETLIFY_AUTH_URL,
  REDIRECT_URI,
} from './netlify-oauth.js';

// Mock import.meta.env
vi.stubEnv('VITE_NETLIFY_CLIENT_ID', 'test-client-id');

describe('Netlify OAuth', () => {
  beforeEach(async () => {
    // Reset database
    await db.delete();
    await db.open();
    // Clear sessionStorage
    sessionStorage.clear();
  });

  describe('generateAuthUrl', () => {
    it('builds correct authorization URL', () => {
      const url = generateAuthUrl();

      expect(url).toContain(NETLIFY_AUTH_URL);
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=token');
      expect(url).toContain(`redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
    });

    it('includes state parameter for CSRF protection', () => {
      const url = generateAuthUrl();

      expect(url).toContain('state=');
      // State should be a UUID-like string
      const stateMatch = url.match(/state=([^&]+)/);
      expect(stateMatch).not.toBeNull();
      expect(stateMatch[1].length).toBeGreaterThan(10);
    });

    it('stores state in sessionStorage', () => {
      generateAuthUrl();

      const storedState = getStoredState();
      expect(storedState).not.toBeNull();
      expect(storedState.length).toBeGreaterThan(10);
    });

    it('generates unique state each time', () => {
      const url1 = generateAuthUrl();
      const state1 = url1.match(/state=([^&]+)/)[1];

      const url2 = generateAuthUrl();
      const state2 = url2.match(/state=([^&]+)/)[1];

      expect(state1).not.toBe(state2);
    });
  });

  describe('handleOAuthCallback', () => {
    it('extracts token from URL hash', () => {
      // Generate auth URL first to set state
      const authUrl = generateAuthUrl();
      const state = authUrl.match(/state=([^&]+)/)[1];

      const hash = `#access_token=my-access-token&token_type=Bearer&state=${state}`;

      const result = handleOAuthCallback(hash);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('my-access-token');
    });

    it('validates state parameter', () => {
      // Generate auth URL to set expected state
      generateAuthUrl();

      // Use wrong state
      const hash = '#access_token=token&state=wrong-state';

      const result = handleOAuthCallback(hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('state');
    });

    it('rejects when state is missing from callback', () => {
      generateAuthUrl();

      const hash = '#access_token=token';

      const result = handleOAuthCallback(hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('state');
    });

    it('handles missing token in hash', () => {
      const authUrl = generateAuthUrl();
      const state = authUrl.match(/state=([^&]+)/)[1];

      const hash = `#state=${state}`;

      const result = handleOAuthCallback(hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('token');
    });

    it('handles error response from Netlify', () => {
      const authUrl = generateAuthUrl();
      const state = authUrl.match(/state=([^&]+)/)[1];

      const hash = `#error=access_denied&error_description=User+denied+access&state=${state}`;

      const result = handleOAuthCallback(hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('access_denied');
    });

    it('clears stored state after successful callback', () => {
      const authUrl = generateAuthUrl();
      const state = authUrl.match(/state=([^&]+)/)[1];

      const hash = `#access_token=token&state=${state}`;
      handleOAuthCallback(hash);

      expect(getStoredState()).toBeNull();
    });

    it('handles empty hash', () => {
      generateAuthUrl();

      const result = handleOAuthCallback('');

      expect(result.success).toBe(false);
    });

    it('handles hash with only #', () => {
      generateAuthUrl();

      const result = handleOAuthCallback('#');

      expect(result.success).toBe(false);
    });
  });

  describe('clearStoredState', () => {
    it('removes state from sessionStorage', () => {
      generateAuthUrl(); // Sets state
      expect(getStoredState()).not.toBeNull();

      clearStoredState();

      expect(getStoredState()).toBeNull();
    });
  });
});
