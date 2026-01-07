import { beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock URL.createObjectURL for image tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Note: Database reset will be handled per-test once we create the db instance
// For now, this provides the basic test environment setup
