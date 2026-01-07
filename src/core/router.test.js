import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from './router.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    // Reset browser history to root
    window.history.replaceState({}, '', '/');
    router = new Router();
  });

  describe('Route Registration', () => {
    it('registers a route with handler', () => {
      const handler = vi.fn();
      router.on('/posts', handler);

      expect(router.routes).toHaveLength(1);
      expect(router.routes[0].handler).toBe(handler);
    });

    it('registers multiple routes', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.on('/posts', handler1);
      router.on('/settings', handler2);

      expect(router.routes).toHaveLength(2);
    });
  });

  describe('Pattern Matching', () => {
    it('matches exact path', () => {
      const handler = vi.fn();
      router.on('/posts', handler);

      router.navigate('/posts');

      expect(handler).toHaveBeenCalledWith({});
    });

    it('matches path with single parameter', () => {
      const handler = vi.fn();
      router.on('/posts/:id', handler);

      router.navigate('/posts/abc123');

      expect(handler).toHaveBeenCalledWith({ id: 'abc123' });
    });

    it('matches path with multiple parameters', () => {
      const handler = vi.fn();
      router.on('/posts/:id/edit/:section', handler);

      router.navigate('/posts/abc123/edit/content');

      expect(handler).toHaveBeenCalledWith({
        id: 'abc123',
        section: 'content'
      });
    });

    it('does not match incorrect paths', () => {
      const handler = vi.fn();
      router.on('/posts', handler);

      router.navigate('/settings');

      expect(handler).not.toHaveBeenCalled();
    });

    it('matches first registered route when multiple match', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.on('/posts/:id', handler1);
      router.on('/posts/:slug', handler2);

      router.navigate('/posts/abc123');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('distinguishes between static and dynamic segments', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.on('/posts/drafts', handler1);  // Static - should match first
      router.on('/posts/:id', handler2);     // Dynamic

      router.navigate('/posts/drafts');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('updates browser URL when navigating', () => {
      router.navigate('/posts');

      expect(window.location.pathname).toBe('/posts');
    });

    it('calls matching route handler when navigating', () => {
      const handler = vi.fn();
      router.on('/posts', handler);

      router.navigate('/posts');

      expect(handler).toHaveBeenCalledOnce();
    });

    it('supports replace mode to avoid adding history entry', () => {
      router.navigate('/posts');
      router.navigate('/settings', { replace: true });

      expect(window.location.pathname).toBe('/settings');
      // Note: Can't easily test history length in jsdom, but implementation uses replaceState
    });

    it('navigates to root path', () => {
      const handler = vi.fn();
      router.on('/', handler);

      router.navigate('/');

      expect(window.location.pathname).toBe('/');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Browser History', () => {
    it('handles browser back button', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.on('/posts', handler1);
      router.on('/settings', handler2);

      router.navigate('/posts');
      router.navigate('/settings');

      handler1.mockClear();
      handler2.mockClear();

      // Simulate back button
      window.history.back();

      // Trigger popstate manually (jsdom doesn't auto-trigger)
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(handler1).toHaveBeenCalled();
    });

    it('handles browser forward button', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.on('/posts', handler1);
      router.on('/settings', handler2);

      router.navigate('/posts');
      router.navigate('/settings');
      window.history.back();

      handler1.mockClear();
      handler2.mockClear();

      // Simulate forward button
      window.history.forward();
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('Initial Route Handling', () => {
    it('calls handler for current path on initialization', () => {
      const handler = vi.fn();
      window.history.replaceState({}, '', '/posts');

      const newRouter = new Router();
      newRouter.on('/posts', handler);
      newRouter.handleRoute(); // Manually trigger since constructor already ran

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Not Found Handling', () => {
    it('calls notFound handler when no route matches', () => {
      const notFoundHandler = vi.fn();
      router.onNotFound(notFoundHandler);

      router.navigate('/nonexistent');

      expect(notFoundHandler).toHaveBeenCalledWith('/nonexistent');
    });

    it('does not call notFound handler when route matches', () => {
      const handler = vi.fn();
      const notFoundHandler = vi.fn();

      router.on('/posts', handler);
      router.onNotFound(notFoundHandler);

      router.navigate('/posts');

      expect(handler).toHaveBeenCalled();
      expect(notFoundHandler).not.toHaveBeenCalled();
    });
  });

  describe('Current Route State', () => {
    it('stores current path', () => {
      router.navigate('/posts/abc123');

      expect(router.currentPath).toBe('/posts/abc123');
    });

    it('stores current params', () => {
      router.on('/posts/:id', () => {});
      router.navigate('/posts/abc123');

      expect(router.currentParams).toEqual({ id: 'abc123' });
    });

    it('clears params when navigating to route without params', () => {
      router.on('/posts/:id', () => {});
      router.on('/settings', () => {});

      router.navigate('/posts/abc123');
      expect(router.currentParams).toEqual({ id: 'abc123' });

      router.navigate('/settings');
      expect(router.currentParams).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('handles trailing slashes consistently', () => {
      const handler = vi.fn();
      router.on('/posts', handler);

      router.navigate('/posts/');

      expect(handler).toHaveBeenCalled();
    });

    it('handles paths with no leading slash', () => {
      const handler = vi.fn();
      router.on('/posts', handler);

      // Navigate using path without leading slash
      window.history.pushState({}, '', 'posts');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(handler).toHaveBeenCalled();
    });

    it('handles empty path as root', () => {
      const handler = vi.fn();
      router.on('/', handler);

      window.history.pushState({}, '', '');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(handler).toHaveBeenCalled();
    });
  });
});
