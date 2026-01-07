import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, createPost, deletePost } from '../core/storage.js';
import { renderTrashView } from './trash-view.js';

describe('TrashView Component', () => {
  let container;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'trash-view-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should render empty state when no trashed posts exist', async () => {
    await renderTrashView(container);

    expect(container.textContent).toContain('Trash is empty');
  });

  it('should render a list of trashed posts', async () => {
    // Create and trash posts
    const post1 = await createPost({ title: 'Trashed Post 1', content: [] });
    await deletePost(post1.id);

    const post2 = await createPost({ title: 'Trashed Post 2', content: [] });
    await deletePost(post2.id);

    await renderTrashView(container);

    expect(container.textContent).toContain('Trashed Post 1');
    expect(container.textContent).toContain('Trashed Post 2');
  });

  it('should not show non-trashed posts', async () => {
    // Create a normal post
    await createPost({ title: 'Active Post', content: [] });

    // Create and trash a post
    const trashed = await createPost({ title: 'Trashed Post', content: [] });
    await deletePost(trashed.id);

    await renderTrashView(container);

    expect(container.textContent).toContain('Trashed Post');
    expect(container.textContent).not.toContain('Active Post');
  });

  it('should render restore button for each trashed post', async () => {
    const post1 = await createPost({ title: 'Post 1', content: [] });
    await deletePost(post1.id);

    const post2 = await createPost({ title: 'Post 2', content: [] });
    await deletePost(post2.id);

    await renderTrashView(container);

    const restoreButtons = container.querySelectorAll('[data-action="restore"]');
    expect(restoreButtons).toHaveLength(2);
  });

  it('should call onRestore callback when restore button is clicked', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });
    await deletePost(post.id);

    const onRestore = vi.fn();
    await renderTrashView(container, { onRestore });

    const restoreButton = container.querySelector('[data-action="restore"]');
    restoreButton.click();

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(post.id);
  });

  it('should render delete permanently button for each trashed post', async () => {
    const post1 = await createPost({ title: 'Post 1', content: [] });
    await deletePost(post1.id);

    const post2 = await createPost({ title: 'Post 2', content: [] });
    await deletePost(post2.id);

    await renderTrashView(container);

    const deleteButtons = container.querySelectorAll('[data-action="delete-permanent"]');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should call onDeletePermanent callback when delete permanently button is clicked', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });
    await deletePost(post.id);

    const onDeletePermanent = vi.fn();
    await renderTrashView(container, { onDeletePermanent });

    const deleteButton = container.querySelector('[data-action="delete-permanent"]');
    deleteButton.click();

    expect(onDeletePermanent).toHaveBeenCalledTimes(1);
    expect(onDeletePermanent).toHaveBeenCalledWith(post.id);
  });

  it('should render a back/close button', async () => {
    await renderTrashView(container);

    const backButton = container.querySelector('[data-action="close-trash"]');
    expect(backButton).toBeTruthy();
  });

  it('should call onClose callback when close button is clicked', async () => {
    const onClose = vi.fn();
    await renderTrashView(container, { onClose });

    const closeButton = container.querySelector('[data-action="close-trash"]');
    closeButton.click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display trash count in header', async () => {
    const post1 = await createPost({ title: 'Post 1', content: [] });
    await deletePost(post1.id);

    const post2 = await createPost({ title: 'Post 2', content: [] });
    await deletePost(post2.id);

    await renderTrashView(container);

    expect(container.textContent).toMatch(/2.*item/i);
  });

  it('should display relative time for when post was trashed', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });
    await deletePost(post.id);

    await renderTrashView(container);

    // Should show some kind of time indicator
    const trashItem = container.querySelector('.trash-item');
    expect(trashItem.textContent).toMatch(/ago|updated|deleted/i);
  });

  it('should show proper singular/plural for item count', async () => {
    const post = await createPost({ title: 'Single Post', content: [] });
    await deletePost(post.id);

    await renderTrashView(container);

    // Should say "1 item" not "1 items"
    expect(container.textContent).toMatch(/1.*item[^s]/i);
  });
});
