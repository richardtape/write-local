import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db, createPost, getPost } from '../core/storage.js';
import { renderPostThemeSelector, updatePostThemeSelector } from './post-theme-selector.js';

// Mock the theme engine
vi.mock('../core/theme-engine.js', () => ({
  loadTheme: vi.fn(() => Promise.resolve()),
  getDefaultTheme: vi.fn(() => Promise.resolve('minimal')),
}));

import { loadTheme, getDefaultTheme } from '../core/theme-engine.js';

describe('PostThemeSelector Component', () => {
  let container;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Reset mocks
    vi.clearAllMocks();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'theme-selector-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('rendering', () => {
    it('should render a select element', async () => {
      await renderPostThemeSelector(container);

      const select = container.querySelector('select');
      expect(select).toBeTruthy();
    });

    it('should have theme options', async () => {
      await renderPostThemeSelector(container);

      const select = container.querySelector('select');
      const options = Array.from(select.options).map(opt => opt.value);

      expect(options).toContain('minimal');
      expect(options).toContain('modern');
    });

    it('should have a label', async () => {
      await renderPostThemeSelector(container);

      const label = container.querySelector('label');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Theme');
    });

    it('should use post-theme-selector class', async () => {
      await renderPostThemeSelector(container);

      const wrapper = container.querySelector('.post-theme-selector');
      expect(wrapper).toBeTruthy();
    });
  });

  describe('without post', () => {
    it('should show default theme when no post is loaded', async () => {
      getDefaultTheme.mockResolvedValue('minimal');

      await renderPostThemeSelector(container);

      const select = container.querySelector('select');
      expect(select.value).toBe('minimal');
    });

    it('should disable select when no post is loaded', async () => {
      await renderPostThemeSelector(container);

      const select = container.querySelector('select');
      expect(select.disabled).toBe(true);
    });
  });

  describe('with post', () => {
    let post;

    beforeEach(async () => {
      post = await createPost({
        title: 'Test Post',
        content: [],
        theme: 'modern',
      });
    });

    it('should show post theme when post is loaded', async () => {
      await renderPostThemeSelector(container, { postId: post.id });

      const select = container.querySelector('select');
      expect(select.value).toBe('modern');
    });

    it('should enable select when post is loaded', async () => {
      await renderPostThemeSelector(container, { postId: post.id });

      const select = container.querySelector('select');
      expect(select.disabled).toBe(false);
    });

    it('should use default theme if post has no theme set', async () => {
      const postNoTheme = await createPost({
        title: 'No Theme Post',
        content: [],
      });

      getDefaultTheme.mockResolvedValue('minimal');

      await renderPostThemeSelector(container, { postId: postNoTheme.id });

      const select = container.querySelector('select');
      expect(select.value).toBe('minimal');
    });

    it('should update post theme when selection changes', async () => {
      await renderPostThemeSelector(container, { postId: post.id });

      const select = container.querySelector('select');
      select.value = 'minimal';
      select.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedPost = await getPost(post.id);
      expect(updatedPost.theme).toBe('minimal');
    });

    it('should apply theme visually when selection changes', async () => {
      await renderPostThemeSelector(container, { postId: post.id });

      const select = container.querySelector('select');
      select.value = 'minimal';
      select.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loadTheme).toHaveBeenCalledWith('minimal');
    });

    it('should call onChange callback when theme changes', async () => {
      const onChange = vi.fn();

      await renderPostThemeSelector(container, {
        postId: post.id,
        onChange,
      });

      const select = container.querySelector('select');
      select.value = 'minimal';
      select.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onChange).toHaveBeenCalledWith('minimal');
    });
  });

  describe('updatePostThemeSelector', () => {
    it('should update selector when post changes', async () => {
      // Render with no post first
      await renderPostThemeSelector(container);

      // Create a post
      const post = await createPost({
        title: 'New Post',
        content: [],
        theme: 'modern',
      });

      // Update the selector with the new post
      await updatePostThemeSelector(container, { postId: post.id });

      const select = container.querySelector('select');
      expect(select.value).toBe('modern');
      expect(select.disabled).toBe(false);
    });

    it('should disable selector when post is cleared', async () => {
      const post = await createPost({
        title: 'Test Post',
        content: [],
        theme: 'modern',
      });

      await renderPostThemeSelector(container, { postId: post.id });

      // Clear the post
      await updatePostThemeSelector(container, { postId: null });

      const select = container.querySelector('select');
      expect(select.disabled).toBe(true);
    });

    it('should load theme for new post', async () => {
      const post = await createPost({
        title: 'Test Post',
        content: [],
        theme: 'modern',
      });

      await renderPostThemeSelector(container);

      // Update with post
      await updatePostThemeSelector(container, { postId: post.id });

      expect(loadTheme).toHaveBeenCalledWith('modern');
    });
  });
});
