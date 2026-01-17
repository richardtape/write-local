import { http, HttpResponse } from 'msw';

/**
 * Default mock data for Netlify API responses
 */
export const mockSites = [
  {
    id: 'site-abc123',
    name: 'my-blog',
    url: 'https://my-blog.netlify.app',
    ssl_url: 'https://my-blog.netlify.app',
    admin_url: 'https://app.netlify.com/sites/my-blog',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'site-def456',
    name: 'another-site',
    url: 'https://another-site.netlify.app',
    ssl_url: 'https://another-site.netlify.app',
    admin_url: 'https://app.netlify.com/sites/another-site',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
  },
];

export const mockDeploy = {
  id: 'deploy-xyz789',
  site_id: 'site-abc123',
  state: 'ready',
  url: 'https://deploy-preview-1--my-blog.netlify.app',
  ssl_url: 'https://deploy-preview-1--my-blog.netlify.app',
  deploy_ssl_url: 'https://my-blog.netlify.app',
  admin_url: 'https://app.netlify.com/sites/my-blog/deploys/deploy-xyz789',
  created_at: '2024-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:01:00Z',
};

export const mockNewSite = {
  id: 'site-new123',
  name: 'writelocal-blog-abc123',
  url: 'https://writelocal-blog-abc123.netlify.app',
  ssl_url: 'https://writelocal-blog-abc123.netlify.app',
  admin_url: 'https://app.netlify.com/sites/writelocal-blog-abc123',
  created_at: '2024-01-16T00:00:00Z',
};

/**
 * Helper to check authorization header
 */
function checkAuth(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return HttpResponse.json(
      { message: 'Unauthorized', code: 401 },
      { status: 401 }
    );
  }
  return null;
}

/**
 * MSW handlers for Netlify API
 */
export const netlifyHandlers = [
  // List user's sites
  http.get('https://api.netlify.com/api/v1/sites', ({ request }) => {
    const authError = checkAuth(request);
    if (authError) return authError;

    return HttpResponse.json(mockSites);
  }),

  // Create new site with deploy (ZIP upload)
  http.post('https://api.netlify.com/api/v1/sites', async ({ request }) => {
    const authError = checkAuth(request);
    if (authError) return authError;

    const contentType = request.headers.get('Content-Type');

    if (contentType === 'application/zip') {
      // ZIP deploy - create site and start deploy
      return HttpResponse.json({
        ...mockNewSite,
        deploy: {
          id: 'deploy-new456',
          state: 'uploading',
          url: `https://${mockNewSite.name}.netlify.app`,
        },
      });
    }

    // JSON body - create empty site
    return HttpResponse.json(mockNewSite);
  }),

  // Deploy to existing site
  http.post('https://api.netlify.com/api/v1/sites/:siteId/deploys', async ({ request, params }) => {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { siteId } = params;

    return HttpResponse.json({
      id: 'deploy-update789',
      site_id: siteId,
      state: 'uploading',
      url: `https://deploy-preview--site-${siteId}.netlify.app`,
      deploy_ssl_url: `https://site-${siteId}.netlify.app`,
    });
  }),

  // Get deploy status
  http.get('https://api.netlify.com/api/v1/deploys/:deployId', ({ request, params }) => {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { deployId } = params;

    return HttpResponse.json({
      ...mockDeploy,
      id: deployId,
      state: 'ready',
    });
  }),

  // Get single site
  http.get('https://api.netlify.com/api/v1/sites/:siteId', ({ request, params }) => {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { siteId } = params;
    const site = mockSites.find(s => s.id === siteId);

    if (!site) {
      return HttpResponse.json(
        { message: 'Site not found', code: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json(site);
  }),
];

/**
 * Error handlers for testing error scenarios
 */
export const netlifyErrorHandlers = {
  unauthorized: http.get('https://api.netlify.com/api/v1/sites', () => {
    return HttpResponse.json(
      { message: 'Unauthorized', code: 401 },
      { status: 401 }
    );
  }),

  rateLimited: http.post('https://api.netlify.com/api/v1/sites', () => {
    return HttpResponse.json(
      { message: 'Rate limit exceeded', code: 429 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }),

  deployFailed: http.get('https://api.netlify.com/api/v1/deploys/:deployId', ({ params }) => {
    return HttpResponse.json({
      id: params.deployId,
      state: 'error',
      error_message: 'Build failed: Invalid configuration',
    });
  }),

  serverError: http.post('https://api.netlify.com/api/v1/sites', () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }),
};
