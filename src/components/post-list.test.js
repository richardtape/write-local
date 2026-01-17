import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, createPost, updatePost, setStatus } from '../core/storage.js';
import { renderPostList } from './post-list.js';

describe('PostList Component', () => {
  let container;
  let mockRouter;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'post-list-container';
    document.body.appendChild(container);

    // Create mock router
    mockRouter = {
      navigate: vi.fn(),
      handleRoute: vi.fn()
    };
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should render an empty state when no posts exist', async () => {
    await renderPostList(container, { router: mockRouter });

    expect(container.textContent).toContain('No posts yet');
  });

  it('should render a list of posts', async () => {
    // Create test posts
    await createPost({ title: 'First Post', content: [] });
    await createPost({ title: 'Second Post', content: [] });
    await createPost({ title: 'Third Post', content: [] });

    await renderPostList(container, { router: mockRouter });

    // Should show all three posts
    expect(container.textContent).toContain('First Post');
    expect(container.textContent).toContain('Second Post');
    expect(container.textContent).toContain('Third Post');
  });

  it('should display posts in order of most recently updated first', async () => {
    // Create posts with delays
    await createPost({ title: 'Oldest Post', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));

    await createPost({ title: 'Middle Post', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));

    await createPost({ title: 'Newest Post', content: [] });

    await renderPostList(container, { router: mockRouter });

    const postItems = container.querySelectorAll('.post-item');
    expect(postItems).toHaveLength(3);

    // First item should be the newest
    expect(postItems[0].textContent).toContain('Newest Post');
    expect(postItems[1].textContent).toContain('Middle Post');
    expect(postItems[2].textContent).toContain('Oldest Post');
  });

  it('should display post status for each post', async () => {
    const draft = await createPost({ title: 'Draft Post', content: [] });
    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    const pending = await createPost({ title: 'Pending Post', content: [] });
    await setStatus(pending.id, 'pending');

    await renderPostList(container, { router: mockRouter });

    expect(container.textContent).toContain('draft');
    expect(container.textContent).toContain('published');
    expect(container.textContent).toContain('pending');
  });

  it('should display relative time for last updated', async () => {
    await createPost({ title: 'Recent Post', content: [] });

    await renderPostList(container, { router: mockRouter });

    // Should show some kind of time indicator
    // (actual format will depend on implementation, but should exist)
    const postItem = container.querySelector('.post-item');
    expect(postItem.textContent).toMatch(/ago|updated|seconds|minutes|hours/i);
  });

  it('should exclude trashed posts from the list', async () => {
    await createPost({ title: 'Active Post', content: [] });

    const trashed = await createPost({ title: 'Trashed Post', content: [] });
    await setStatus(trashed.id, 'trashed');

    await renderPostList(container, { router: mockRouter });

    expect(container.textContent).toContain('Active Post');
    expect(container.textContent).not.toContain('Trashed Post');
  });

  it('should render a "New Post" button', async () => {
    await renderPostList(container, { router: mockRouter });

    const newPostButton = container.querySelector('[data-action="new-post"]');
    expect(newPostButton).toBeTruthy();
    expect(newPostButton.textContent).toMatch(/new post/i);
  });

  it('should navigate to /posts when "New Post" button is clicked', async () => {
    await renderPostList(container, { router: mockRouter });

    const newPostButton = container.querySelector('[data-action="new-post"]');
    newPostButton.click();

    // Wait for async operations (createPost) to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockRouter.navigate).toHaveBeenCalledWith('/posts');
  });

  it('should navigate to post URL when a post is clicked', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });

    await renderPostList(container, { router: mockRouter });

    const postItem = container.querySelector('.post-item');
    postItem.click();

    expect(mockRouter.navigate).toHaveBeenCalledWith(`/posts/${post.id}`);
  });

  it('should highlight the currently active post', async () => {
    const post1 = await createPost({ title: 'Post 1', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));
    const post2 = await createPost({ title: 'Post 2', content: [] });

    await renderPostList(container, { router: mockRouter, currentPostId: post2.id });

    const postItems = container.querySelectorAll('.post-item');

    // post2 is newest, so it's at index 0 and should be active
    expect(postItems[0].classList.contains('active')).toBe(true);
    expect(postItems[1].classList.contains('active')).toBe(false);
  });

  it('should render filter buttons for All, Drafts, and Published', async () => {
    await renderPostList(container, { router: mockRouter });

    const allButton = container.querySelector('[data-filter="all"]');
    const draftsButton = container.querySelector('[data-filter="draft"]');
    const publishedButton = container.querySelector('[data-filter="published"]');

    expect(allButton).toBeTruthy();
    expect(draftsButton).toBeTruthy();
    expect(publishedButton).toBeTruthy();
  });

  it('should filter posts to show only drafts when Drafts filter is clicked', async () => {
    await createPost({ title: 'Draft Post', content: [] });

    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    await renderPostList(container, { router: mockRouter });

    // Click the Drafts filter
    const draftsButton = container.querySelector('[data-filter="draft"]');
    draftsButton.click();

    // Verify router.navigate was called
    expect(mockRouter.navigate).toHaveBeenCalledWith('/posts/drafts');

    // Simulate what the router would do: re-render with filter='draft'
    await renderPostList(container, { router: mockRouter, filter: 'draft' });

    // Should only show draft posts
    expect(container.textContent).toContain('Draft Post');
    expect(container.textContent).not.toContain('Published Post');
  });

  it('should filter posts to show only published when Published filter is clicked', async () => {
    await createPost({ title: 'Draft Post', content: [] });

    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    await renderPostList(container, { router: mockRouter });

    // Click the Published filter
    const publishedButton = container.querySelector('[data-filter="published"]');
    publishedButton.click();

    // Verify router.navigate was called
    expect(mockRouter.navigate).toHaveBeenCalledWith('/posts/published');

    // Simulate what the router would do: re-render with filter='published'
    await renderPostList(container, { router: mockRouter, filter: 'published' });

    // Should only show published posts
    expect(container.textContent).toContain('Published Post');
    expect(container.textContent).not.toContain('Draft Post');
  });

  it('should show all posts when All filter is clicked after applying another filter', async () => {
    await createPost({ title: 'Draft Post', content: [] });

    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    // Start with drafts filter
    await renderPostList(container, { router: mockRouter, filter: 'draft' });

    // Should only show draft initially
    expect(container.textContent).toContain('Draft Post');
    expect(container.textContent).not.toContain('Published Post');

    // Click All filter
    const allButton = container.querySelector('[data-filter="all"]');
    allButton.click();

    // Verify router.navigate was called
    expect(mockRouter.navigate).toHaveBeenCalledWith('/posts');

    // Simulate what the router would do: re-render with filter='all'
    await renderPostList(container, { router: mockRouter, filter: 'all' });

    // Should show both posts
    expect(container.textContent).toContain('Draft Post');
    expect(container.textContent).toContain('Published Post');
  });

  it('should mark the active filter button', async () => {
    // Render with filter='all'
    await renderPostList(container, { router: mockRouter, filter: 'all' });

    let allButton = container.querySelector('[data-filter="all"]');
    let draftsButton = container.querySelector('[data-filter="draft"]');

    // All should be active by default
    expect(allButton.classList.contains('active')).toBe(true);
    expect(draftsButton.classList.contains('active')).toBe(false);

    // Re-render with filter='draft'
    await renderPostList(container, { router: mockRouter, filter: 'draft' });

    // Re-query buttons after re-render
    allButton = container.querySelector('[data-filter="all"]');
    draftsButton = container.querySelector('[data-filter="draft"]');

    // Drafts should now be active
    expect(allButton.classList.contains('active')).toBe(false);
    expect(draftsButton.classList.contains('active')).toBe(true);
  });

  it('should show post count for each filter', async () => {
    await createPost({ title: 'Draft 1', content: [] });
    await createPost({ title: 'Draft 2', content: [] });

    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    await renderPostList(container, { router: mockRouter });

    // All filter should show total count (3)
    const allButton = container.querySelector('[data-filter="all"]');
    expect(allButton.textContent).toContain('3');

    // Drafts filter should show draft count (2)
    const draftsButton = container.querySelector('[data-filter="draft"]');
    expect(draftsButton.textContent).toContain('2');

    // Published filter should show published count (1)
    const publishedButton = container.querySelector('[data-filter="published"]');
    expect(publishedButton.textContent).toContain('1');
  });

  it('should update the list when refresh is called', async () => {
    await renderPostList(container, { router: mockRouter });

    // Initially empty
    expect(container.textContent).toContain('No posts yet');

    // Create a post
    await createPost({ title: 'New Post', content: [] });

    // Refresh the list
    await renderPostList(container, { router: mockRouter });

    // Should now show the post
    expect(container.textContent).toContain('New Post');
  });

  // Delete functionality tests
  it('should render a delete button on each post item', async () => {
    await createPost({ title: 'Post 1', content: [] });
    await createPost({ title: 'Post 2', content: [] });

    await renderPostList(container, { router: mockRouter });

    const deleteButtons = container.querySelectorAll('[data-action="delete-post"]');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should move post to trash when delete button is clicked', async () => {
    const post = await createPost({ title: 'Post to Delete', content: [] });

    await renderPostList(container, { router: mockRouter });

    const deleteButton = container.querySelector('[data-action="delete-post"]');
    deleteButton.click();

    // Wait for async delete to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify post is now trashed
    const trashedPosts = await db.posts.where('status').equals('trashed').toArray();
    expect(trashedPosts).toHaveLength(1);
    expect(trashedPosts[0].id).toBe(post.id);
  });

  it('should stop event propagation on delete button click', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });

    await renderPostList(container, { router: mockRouter });

    mockRouter.navigate.mockClear(); // Clear any previous calls

    const deleteButton = container.querySelector('[data-action="delete-post"]');
    deleteButton.click();

    // router.navigate should NOT be called for post selection (event should not bubble)
    // Note: It will be called for handleRoute refresh, but not for post navigation
    const navigateCalls = mockRouter.navigate.mock.calls;
    const hasPostNavigation = navigateCalls.some(call => call[0].startsWith('/posts/') && call[0].length > 7);
    expect(hasPostNavigation).toBe(false);
  });
});
