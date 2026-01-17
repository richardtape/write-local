import { setupServer } from 'msw/node';
import { netlifyHandlers } from './handlers.js';

/**
 * MSW server instance for testing
 *
 * Usage in tests:
 *   import { server } from '../tests/mocks/server.js';
 *
 *   // Override a handler for specific test
 *   server.use(
 *     http.get('https://api.netlify.com/api/v1/sites', () => {
 *       return HttpResponse.json({ error: 'Custom error' }, { status: 500 });
 *     })
 *   );
 */
export const server = setupServer(...netlifyHandlers);
