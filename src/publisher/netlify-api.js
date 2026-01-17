/**
 * Netlify API client
 *
 * Provides functions to interact with Netlify's REST API
 * for site creation, deployment, and status checking.
 */

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

/**
 * Make an authenticated request to the Netlify API
 * @param {string} token - Access token
 * @param {string} endpoint - API endpoint (relative to base)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function netlifyFetch(token, endpoint, options = {}) {
  const url = `${NETLIFY_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response;
}

/**
 * Handle API error responses
 * @param {Response} response - Fetch response
 * @throws {Error} With appropriate message
 */
async function handleError(response) {
  let message = `API error: ${response.status}`;

  try {
    const data = await response.json();
    if (data.message) {
      message = data.message;
    }
  } catch {
    // Ignore JSON parse errors
  }

  if (response.status === 401) {
    throw new Error('Unauthorized: Invalid or expired token');
  }

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait before trying again.');
  }

  throw new Error(message);
}

/**
 * List all sites for the authenticated user
 * @param {string} token - Access token
 * @returns {Promise<Array>} Array of site objects
 */
export async function listSites(token) {
  const response = await netlifyFetch(token, '/sites');

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

/**
 * Create a new site with a ZIP deploy
 * @param {string} token - Access token
 * @param {Blob} zipBlob - ZIP file blob
 * @param {Object} options - Site options
 * @param {string} [options.name] - Site name (auto-generated if not provided)
 * @returns {Promise<Object>} Created site with deploy info
 */
export async function createSiteWithDeploy(token, zipBlob, options = {}) {
  // Get current sites before creating (to detect new site after CORS error)
  let sitesBefore = [];
  try {
    sitesBefore = await listSites(token);
  } catch (e) {
    // Ignore - we'll try without the comparison
  }

  try {
    const response = await netlifyFetch(token, '/sites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });

    if (!response.ok) {
      await handleError(response);
    }

    return response.json();
  } catch (error) {
    // CORS error - the request might have succeeded but browser blocked the response
    // Netlify's API has a bug where it sends duplicate CORS headers
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('CORS error detected, checking if site was created...');

      // Wait a moment for the site to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if a new site was created
      const sitesAfter = await listSites(token);
      const newSite = sitesAfter.find(
        site => !sitesBefore.some(s => s.id === site.id)
      );

      if (newSite) {
        console.log('Site was created despite CORS error:', newSite.name);
        // Return a compatible response structure
        // Include URL in both places so deploy-service can find it
        return {
          ...newSite,
          deploy: {
            id: 'pending', // We don't have the deploy ID, but the site exists
            state: 'ready', // Assume ready since site was created with ZIP
            ssl_url: newSite.ssl_url,
            url: newSite.url,
            deploy_ssl_url: newSite.ssl_url,
          },
        };
      }

      // If no new site found, throw a helpful error
      throw new Error(
        'Unable to verify site creation due to a Netlify API issue. ' +
        'Your site may have been created - please check your Netlify dashboard.'
      );
    }

    throw error;
  }
}

/**
 * Deploy to an existing site
 * @param {string} token - Access token
 * @param {string} siteId - Site ID to deploy to
 * @param {Blob} zipBlob - ZIP file blob
 * @returns {Promise<Object>} Deploy info
 */
export async function deployToSite(token, siteId, zipBlob) {
  // Get site info before deploying (to detect new deploy after CORS error)
  let siteBefore = null;
  try {
    siteBefore = await getSite(token, siteId);
  } catch (e) {
    // Ignore - we'll try without the comparison
  }

  try {
    const response = await netlifyFetch(token, `/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });

    if (!response.ok) {
      await handleError(response);
    }

    return response.json();
  } catch (error) {
    // CORS error - the request might have succeeded but browser blocked the response
    // Netlify's API has a bug where it sends duplicate CORS headers
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('CORS error detected on deploy, checking if deploy succeeded...');

      // Wait a moment for the deploy to be registered
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if the site has a new deploy
      const siteAfter = await getSite(token, siteId);

      // Compare deploy IDs - if different, a new deploy was created
      const beforeDeployId = siteBefore?.published_deploy?.id;
      const afterDeployId = siteAfter?.published_deploy?.id;

      if (afterDeployId && afterDeployId !== beforeDeployId) {
        console.log('Deploy succeeded despite CORS error');
        // Return a compatible response structure
        return {
          id: 'pending', // We don't have the exact deploy ID readily available
          state: 'ready',
          ssl_url: siteAfter.ssl_url,
          url: siteAfter.url,
        };
      }

      // Also check if deploy_id changed even if published_deploy hasn't updated yet
      if (siteAfter?.deploy_id && siteAfter.deploy_id !== siteBefore?.deploy_id) {
        console.log('New deploy detected despite CORS error');
        return {
          id: 'pending',
          state: 'ready',
          ssl_url: siteAfter.ssl_url,
          url: siteAfter.url,
        };
      }

      // If no new deploy found, throw a helpful error
      throw new Error(
        'Unable to verify deployment due to a Netlify API issue. ' +
        'Your site may have been updated - please check your Netlify dashboard.'
      );
    }

    throw error;
  }
}

/**
 * Get the status of a deploy
 * @param {string} token - Access token
 * @param {string} deployId - Deploy ID
 * @returns {Promise<Object>} Deploy status object
 */
export async function getDeployStatus(token, deployId) {
  const response = await netlifyFetch(token, `/deploys/${deployId}`);

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

/**
 * Wait for a deploy to be ready
 * @param {string} token - Access token
 * @param {string} deployId - Deploy ID
 * @param {Object} options - Polling options
 * @param {number} [options.pollInterval=2000] - Milliseconds between polls
 * @param {number} [options.maxAttempts=60] - Maximum polling attempts
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} Final deploy status
 */
export async function waitForDeployReady(token, deployId, options = {}) {
  const {
    pollInterval = 2000,
    maxAttempts = 60,
    onProgress,
  } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getDeployStatus(token, deployId);

    if (onProgress) {
      onProgress(status);
    }

    // Check for terminal states
    if (status.state === 'ready') {
      return status;
    }

    if (status.state === 'error') {
      throw new Error(`Deploy failed: ${status.error_message || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error(`Deploy timed out after ${maxAttempts} attempts`);
}

/**
 * Get a single site by ID
 * @param {string} token - Access token
 * @param {string} siteId - Site ID
 * @returns {Promise<Object>} Site object
 */
export async function getSite(token, siteId) {
  const response = await netlifyFetch(token, `/sites/${siteId}`);

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}
