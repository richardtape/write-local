import { beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { server } from './mocks/server.js';

// Mock URL.createObjectURL for image tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock CSS imports with ?raw suffix (Vite feature not available in test environment)
vi.mock('../src/themes/base.css?raw', () => ({
  default: `
:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
}
.post-content {
  background-color: var(--color-background);
  color: var(--color-text);
}
`,
}));

vi.mock('../src/themes/minimal.css?raw', () => ({
  default: `
:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
}
`,
}));

vi.mock('../src/themes/modern.css?raw', () => ({
  default: `
:root {
  --color-background: #fafaf8;
  --color-text: #2d2d2d;
}
`,
}));

// Mock archive CSS imports
vi.mock('../src/themes/archive-base.css?raw', () => ({
  default: `
:root {
  --archive-bg: #ffffff;
  --archive-text: #1a1a1a;
}
.archive-content {
  background: var(--archive-bg);
  color: var(--archive-text);
}
`,
}));

vi.mock('../src/themes/archive-minimal.css?raw', () => ({
  default: `
:root {
  --archive-bg: #ffffff;
  --archive-text: #1a1a1a;
}
`,
}));

vi.mock('../src/themes/archive-modern.css?raw', () => ({
  default: `
:root {
  --archive-bg: #fafaf8;
  --archive-text: #2d2d2d;
}
`,
}));

// MSW server lifecycle hooks
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Note: Database reset will be handled per-test once we create the db instance
// For now, this provides the basic test environment setup
