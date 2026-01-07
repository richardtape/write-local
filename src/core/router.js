/**
 * Lightweight History API router for Write Local
 * Supports parameterized routes, browser history, and clean URLs
 */
export class Router {
  constructor() {
    this.routes = [];
    this.notFoundHandler = null;
    this.currentPath = window.location.pathname;
    this.currentParams = {};

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => this.handleRoute());
  }

  /**
   * Register a route with a handler
   * @param {string} pattern - Route pattern (e.g., "/posts/:id")
   * @param {Function} handler - Called with params object when route matches
   */
  on(pattern, handler) {
    const parsedPattern = this.parsePattern(pattern);
    this.routes.push({
      pattern,
      regex: parsedPattern.regex,
      paramNames: parsedPattern.paramNames,
      handler
    });
  }

  /**
   * Register a handler for when no routes match
   * @param {Function} handler - Called with current path
   */
  onNotFound(handler) {
    this.notFoundHandler = handler;
  }

  /**
   * Navigate to a new route programmatically
   * @param {string} path - Path to navigate to
   * @param {Object} options - Navigation options
   * @param {boolean} options.replace - Use replaceState instead of pushState
   */
  navigate(path, options = {}) {
    const normalizedPath = this.normalizePath(path);

    if (options.replace) {
      window.history.replaceState({}, '', normalizedPath);
    } else {
      window.history.pushState({}, '', normalizedPath);
    }

    this.handleRoute();
  }

  /**
   * Handle the current route (called on navigation and popstate)
   */
  handleRoute() {
    const path = this.normalizePath(window.location.pathname);
    this.currentPath = path;

    // Try to match route (static routes have priority over dynamic)
    const sortedRoutes = this.sortRoutesByPriority();

    for (const route of sortedRoutes) {
      const match = path.match(route.regex);

      if (match) {
        // Extract params from match
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        this.currentParams = params;
        route.handler(params);
        return;
      }
    }

    // No route matched - call not found handler
    this.currentParams = {};
    if (this.notFoundHandler) {
      this.notFoundHandler(path);
    }
  }

  /**
   * Parse route pattern into regex and param names
   * @param {string} pattern - Route pattern (e.g., "/posts/:id")
   * @returns {Object} - { regex: RegExp, paramNames: string[] }
   */
  parsePattern(pattern) {
    const normalizedPattern = this.normalizePath(pattern);
    const paramNames = [];

    // Convert pattern to regex
    // /posts/:id -> /posts/([^/]+)
    const regexPattern = normalizedPattern.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

    // Exact match required
    const regex = new RegExp(`^${regexPattern}$`);

    return { regex, paramNames };
  }

  /**
   * Normalize path (ensure leading slash, remove trailing slash)
   * @param {string} path - Path to normalize
   * @returns {string} - Normalized path
   */
  normalizePath(path) {
    // Handle empty path as root
    if (!path || path === '') {
      return '/';
    }

    // Ensure leading slash
    let normalized = path.startsWith('/') ? path : `/${path}`;

    // Remove trailing slash (unless it's root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Sort routes to prioritize static segments over dynamic (:param)
   * This ensures /posts/drafts matches before /posts/:id
   * @returns {Array} - Sorted routes
   */
  sortRoutesByPriority() {
    return [...this.routes].sort((a, b) => {
      // Count dynamic segments (params)
      const aDynamicCount = a.paramNames.length;
      const bDynamicCount = b.paramNames.length;

      // Routes with fewer params come first (more specific)
      if (aDynamicCount !== bDynamicCount) {
        return aDynamicCount - bDynamicCount;
      }

      // If same number of params, maintain registration order
      return 0;
    });
  }
}
