/**
 * Netlify OAuth authentication module
 *
 * Uses the Implicit Grant flow (token returned directly in URL hash)
 * since Write Local is a client-side only application.
 */

// Netlify OAuth endpoints
export const NETLIFY_AUTH_URL = 'https://app.netlify.com/authorize';

// Redirect URI - must match what's registered in Netlify OAuth app
export const REDIRECT_URI = 'https://writelocal.test/';

// Session storage key for CSRF state
const STATE_KEY = 'netlify_oauth_state';

/**
 * Generate a random state string for CSRF protection
 * @returns {string} Random state string
 */
function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store state in sessionStorage
 * @param {string} state - State to store
 */
function storeState(state) {
  sessionStorage.setItem(STATE_KEY, state);
}

/**
 * Get stored state from sessionStorage
 * @returns {string|null} Stored state or null
 */
export function getStoredState() {
  return sessionStorage.getItem(STATE_KEY);
}

/**
 * Clear stored state from sessionStorage
 */
export function clearStoredState() {
  sessionStorage.removeItem(STATE_KEY);
}

/**
 * Generate the Netlify authorization URL
 * @returns {string} Full authorization URL
 */
export function generateAuthUrl() {
  const clientId = import.meta.env.VITE_NETLIFY_CLIENT_ID;

  if (!clientId) {
    throw new Error('VITE_NETLIFY_CLIENT_ID environment variable is not set');
  }

  // Generate and store state for CSRF protection
  const state = generateState();
  storeState(state);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  return `${NETLIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Parse the URL hash from OAuth callback
 * @param {string} hash - URL hash string (including #)
 * @returns {Object} Parsed parameters
 */
function parseHash(hash) {
  if (!hash || hash === '#') {
    return {};
  }

  // Remove leading #
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash;

  const params = new URLSearchParams(hashContent);
  const result = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

/**
 * Handle the OAuth callback
 * @param {string} hash - URL hash from callback (e.g., #access_token=...&state=...)
 * @returns {Object} Result object { success, accessToken?, error? }
 */
export function handleOAuthCallback(hash) {
  const params = parseHash(hash);

  // Check for error response from Netlify
  if (params.error) {
    clearStoredState();
    return {
      success: false,
      error: `${params.error}: ${params.error_description || 'Authentication failed'}`,
    };
  }

  // Validate state parameter (CSRF protection)
  const storedState = getStoredState();
  if (!storedState || !params.state || params.state !== storedState) {
    return {
      success: false,
      error: 'Invalid state parameter - possible CSRF attack',
    };
  }

  // Check for access token
  if (!params.access_token) {
    return {
      success: false,
      error: 'No access token received',
    };
  }

  // Clear stored state (one-time use)
  clearStoredState();

  return {
    success: true,
    accessToken: params.access_token,
    tokenType: params.token_type || 'Bearer',
  };
}

/**
 * Open OAuth popup window
 * @param {string} url - Authorization URL
 * @returns {Window|null} Popup window reference
 */
export function openAuthPopup(url) {
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=yes',
    'status=no',
  ].join(',');

  return window.open(url, 'netlify-oauth', features);
}
