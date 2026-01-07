import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, createPost, updatePost, setStatus } from '../core/storage.js';
import { renderPostList } from './post-list.js';

describe('PostList Component', () => {
  let container;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'post-list-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should render an empty state when no posts exist', async () => {
    await renderPostList(container);

    expect(container.textContent).toContain('No posts yet');
  });

  it('should render a list of posts', async () => {
    // Create test posts
    await createPost({ title: 'First Post', content: [] });
    await createPost({ title: 'Second Post', content: [] });
    await createPost({ title: 'Third Post', content: [] });

    await renderPostList(container);

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

    await renderPostList(container);

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

    await renderPostList(container);

    expect(container.textContent).toContain('draft');
    expect(container.textContent).toContain('published');
    expect(container.textContent).toContain('pending');
  });

  it('should display relative time for last updated', async () => {
    await createPost({ title: 'Recent Post', content: [] });

    await renderPostList(container);

    // Should show some kind of time indicator
    // (actual format will depend on implementation, but should exist)
    const postItem = container.querySelector('.post-item');
    expect(postItem.textContent).toMatch(/ago|updated|seconds|minutes|hours/i);
  });

  it('should exclude trashed posts from the list', async () => {
    await createPost({ title: 'Active Post', content: [] });

    const trashed = await createPost({ title: 'Trashed Post', content: [] });
    await setStatus(trashed.id, 'trashed');

    await renderPostList(container);

    expect(container.textContent).toContain('Active Post');
    expect(container.textContent).not.toContain('Trashed Post');
  });

  it('should render a "New Post" button', async () => {
    await renderPostList(container);

    const newPostButton = container.querySelector('[data-action="new-post"]');
    expect(newPostButton).toBeTruthy();
    expect(newPostButton.textContent).toMatch(/new post/i);
  });

  it('should call onNewPost callback when "New Post" button is clicked', async () => {
    const onNewPost = vi.fn();

    await renderPostList(container, { onNewPost });

    const newPostButton = container.querySelector('[data-action="new-post"]');
    newPostButton.click();

    expect(onNewPost).toHaveBeenCalledTimes(1);
  });

  it('should call onPostSelect callback when a post is clicked', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });
    const onPostSelect = vi.fn();

    await renderPostList(container, { onPostSelect });

    const postItem = container.querySelector('.post-item');
    postItem.click();

    expect(onPostSelect).toHaveBeenCalledTimes(1);
    expect(onPostSelect).toHaveBeenCalledWith(post.id);
  });

  it('should highlight the currently active post', async () => {
    const post1 = await createPost({ title: 'Post 1', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));
    const post2 = await createPost({ title: 'Post 2', content: [] });

    await renderPostList(container, { currentPostId: post2.id });

    const postItems = container.querySelectorAll('.post-item');

    // post2 is newest, so it's at index 0 and should be active
    expect(postItems[0].classList.contains('active')).toBe(true);
    expect(postItems[1].classList.contains('active')).toBe(false);
  });

  it('should render filter buttons for All, Drafts, and Published', async () => {
    await renderPostList(container);

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

    await renderPostList(container);

    // Click the Drafts filter
    const draftsButton = container.querySelector('[data-filter="draft"]');
    draftsButton.click();

    // Wait for async re-render to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should only show draft posts
    expect(container.textContent).toContain('Draft Post');
    expect(container.textContent).not.toContain('Published Post');
  });

  it('should filter posts to show only published when Published filter is clicked', async () => {
    await createPost({ title: 'Draft Post', content: [] });

    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    await renderPostList(container);

    // Click the Published filter
    const publishedButton = container.querySelector('[data-filter="published"]');
    publishedButton.click();

    // Wait for async re-render to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should only show published posts
    expect(container.textContent).toContain('Published Post');
    expect(container.textContent).not.toContain('Draft Post');
  });

  it('should show all posts when All filter is clicked after applying another filter', async () => {
    await createPost({ title: 'Draft Post', content: [] });

    const published = await createPost({ title: 'Published Post', content: [] });
    await setStatus(published.id, 'published');

    await renderPostList(container);

    // Click Drafts filter first
    const draftsButton = container.querySelector('[data-filter="draft"]');
    draftsButton.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Then click All filter
    const allButton = container.querySelector('[data-filter="all"]');
    allButton.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should show both posts
    expect(container.textContent).toContain('Draft Post');
    expect(container.textContent).toContain('Published Post');
  });

  it('should mark the active filter button', async () => {
    await renderPostList(container);

    let allButton = container.querySelector('[data-filter="all"]');
    let draftsButton = container.querySelector('[data-filter="draft"]');

    // All should be active by default
    expect(allButton.classList.contains('active')).toBe(true);
    expect(draftsButton.classList.contains('active')).toBe(false);

    // Click Drafts
    draftsButton.click();
    await new Promise(resolve => setTimeout(resolve, 10));

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

    await renderPostList(container);

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
    await renderPostList(container);

    // Initially empty
    expect(container.textContent).toContain('No posts yet');

    // Create a post
    await createPost({ title: 'New Post', content: [] });

    // Refresh the list
    await renderPostList(container);

    // Should now show the post
    expect(container.textContent).toContain('New Post');
  });

  // Delete functionality tests
  it('should render a delete button on each post item', async () => {
    await createPost({ title: 'Post 1', content: [] });
    await createPost({ title: 'Post 2', content: [] });

    const onDelete = vi.fn();
    await renderPostList(container, { onDelete });

    const deleteButtons = container.querySelectorAll('[data-action="delete-post"]');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should call onDelete callback when delete button is clicked', async () => {
    const post = await createPost({ title: 'Post to Delete', content: [] });
    const onDelete = vi.fn();

    await renderPostList(container, { onDelete });

    const deleteButton = container.querySelector('[data-action="delete-post"]');
    deleteButton.click();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(post.id);
  });

  it('should not render delete button if onDelete callback is not provided', async () => {
    await createPost({ title: 'Post 1', content: [] });

    await renderPostList(container); // No onDelete callback

    const deleteButtons = container.querySelectorAll('[data-action="delete-post"]');
    expect(deleteButtons).toHaveLength(0);
  });

  it('should stop event propagation on delete button click', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });
    const onDelete = vi.fn();
    const onPostSelect = vi.fn();

    await renderPostList(container, { onDelete, onPostSelect });

    const deleteButton = container.querySelector('[data-action="delete-post"]');
    deleteButton.click();

    // onDelete should be called
    expect(onDelete).toHaveBeenCalledWith(post.id);

    // onPostSelect should NOT be called (event should not bubble to post item)
    expect(onPostSelect).not.toHaveBeenCalled();
  });
});
