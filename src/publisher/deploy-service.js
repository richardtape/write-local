/**
 * Deploy Service - Orchestrates publishing to hosting platforms
 *
 * This module provides high-level functions for deploying posts
 * to various hosting platforms like Netlify, handling the complete
 * flow from export bundle generation to deployment completion.
 */

import { createExportBundle } from '../exporter/bundler.js';
import { createSiteBundle } from '../exporter/site-bundler.js';
import { getToken } from './auth-storage.js';
import {
  createSiteWithDeploy,
  deployToSite,
  waitForDeployReady,
} from './netlify-api.js';
import { getSite, updateSite, getPostsBySite } from '../core/storage.js';

/**
 * Publish a post to Netlify
 * @param {string} postId - ID of the post to publish
 * @param {Object} [options] - Publishing options
 * @param {string} [options.siteId] - Existing site ID to deploy to (creates new site if not provided)
 * @param {Function} [options.onProgress] - Progress callback ({ message, step, total })
 * @returns {Promise<Object>} Result { success, url, siteId, deployId }
 */
export async function publishToNetlify(postId, options = {}) {
  const { siteId = null, onProgress } = options;

  // Helper to report progress
  const progress = (message, step, total = 4) => {
    if (onProgress) {
      onProgress({ message, step, total });
    }
  };

  // Step 1: Check authentication
  progress('Checking authentication...', 1);
  const tokenData = await getToken('netlify');
  if (!tokenData || !tokenData.accessToken) {
    throw new Error('Not authenticated with Netlify. Please connect your account first.');
  }
  const token = tokenData.accessToken;

  // Step 2: Generate export bundle
  progress('Generating export bundle...', 2);
  const zipBlob = await createExportBundle(postId);

  // Step 3: Deploy to Netlify
  progress('Uploading to Netlify...', 3);
  let deployResult;
  let resultSiteId;

  if (siteId) {
    // Deploy to existing site
    deployResult = await deployToSite(token, siteId, zipBlob);
    resultSiteId = siteId;
  } else {
    // Create new site with deploy
    const siteResult = await createSiteWithDeploy(token, zipBlob);
    deployResult = siteResult.deploy;
    resultSiteId = siteResult.id;
  }

  // Step 4: Wait for deploy to be ready
  progress('Waiting for deploy to complete...', 4);

  let url;
  let finalDeployId = deployResult.id;

  // If deploy ID is 'pending', we recovered from a CORS error and the site was created
  // Skip polling and use the site URL directly
  if (deployResult.id === 'pending' || deployResult.state === 'ready') {
    // Site was created with ZIP, should be ready immediately
    url = deployResult.deploy?.deploy_ssl_url || deployResult.ssl_url || deployResult.url;
  } else {
    const finalStatus = await waitForDeployReady(token, deployResult.id, {
      pollInterval: 2000,
      maxAttempts: 60, // 2 minutes max
      onProgress: (status) => {
        progress(`Deploy status: ${status.state}`, 4);
      },
    });

    // Get the final URL and deploy ID
    url = finalStatus.deploy_ssl_url || finalStatus.ssl_url || finalStatus.url;
    finalDeployId = finalStatus.id;
  }

  return {
    success: true,
    url,
    siteId: resultSiteId,
    deployId: finalDeployId,
  };
}

/**
 * Check if the user is authenticated with a platform
 * @param {string} platform - Platform name (e.g., 'netlify')
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated(platform) {
  const tokenData = await getToken(platform);
  return tokenData !== null && tokenData.accessToken !== undefined;
}

/**
 * Publish a full site to Netlify (all published posts + archive page)
 * @param {string} siteId - ID of the Write Local site to publish
 * @param {Object} [options] - Publishing options
 * @param {Function} [options.onProgress] - Progress callback ({ message, step, total })
 * @returns {Promise<Object>} Result { success, url, siteId, deployId }
 */
export async function publishSiteToNetlify(siteId, options = {}) {
  const { onProgress } = options;

  // Helper to report progress
  const progress = (message, step, total = 5) => {
    if (onProgress) {
      onProgress({ message, step, total });
    }
  };

  // Step 1: Check authentication
  progress('Checking authentication...', 1);
  const tokenData = await getToken('netlify');
  if (!tokenData || !tokenData.accessToken) {
    throw new Error('Not authenticated with Netlify. Please connect your account first.');
  }
  const token = tokenData.accessToken;

  // Step 2: Get site from storage
  progress('Loading site configuration...', 2);
  const site = await getSite(siteId);
  if (!site) {
    throw new Error('Site not found');
  }

  // Step 3: Check for published posts
  const publishedPosts = await getPostsBySite(siteId, { status: 'published' });
  if (publishedPosts.length === 0) {
    throw new Error('No published posts. Please publish at least one post first.');
  }

  // Step 4: Generate site bundle
  progress('Generating site bundle...', 3);
  const zipBlob = await createSiteBundle(siteId);

  // Step 5: Deploy to Netlify
  progress('Uploading to Netlify...', 4);
  let deployResult;
  let resultSiteId;
  let resultUrl;

  const isFirstDeploy = !site.platformSiteId;

  if (isFirstDeploy) {
    // Create new Netlify site with deploy
    const siteResult = await createSiteWithDeploy(token, zipBlob);
    deployResult = siteResult.deploy;
    resultSiteId = siteResult.id;
    resultUrl = siteResult.ssl_url || siteResult.deploy?.deploy_ssl_url;
  } else {
    // Deploy to existing Netlify site
    deployResult = await deployToSite(token, site.platformSiteId, zipBlob);
    resultSiteId = site.platformSiteId;
    resultUrl = deployResult.deploy_ssl_url || deployResult.ssl_url || site.platformUrl;
  }

  // Step 6: Wait for deploy to be ready (if needed)
  progress('Waiting for deploy to complete...', 5);

  if (deployResult.id !== 'pending' && deployResult.state !== 'ready') {
    const finalStatus = await waitForDeployReady(token, deployResult.id, {
      pollInterval: 2000,
      maxAttempts: 60,
      onProgress: (status) => {
        progress(`Deploy status: ${status.state}`, 5);
      },
    });
    resultUrl = finalStatus.deploy_ssl_url || finalStatus.ssl_url || resultUrl;
  }

  // Step 7: Update site record with Netlify details
  const updateData = {
    lastPublishedAt: Date.now(),
  };

  // Only set platform details on first deploy
  if (isFirstDeploy) {
    updateData.platform = 'netlify';
    updateData.platformSiteId = resultSiteId;
    updateData.platformUrl = resultUrl;
  }

  await updateSite(siteId, updateData);

  return {
    success: true,
    url: resultUrl,
    siteId: resultSiteId,
    deployId: deployResult.id,
  };
}
