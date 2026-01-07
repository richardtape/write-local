import { describe, it, expect, beforeEach } from 'vitest';
import { db, createPost, getPost, updatePost, listPosts, deletePost, setStatus, getMostRecentPost } from './storage.js';

describe('Storage - Posts', () => {
  // Clean database before each test
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should create and retrieve a post', async () => {
    // Create a new post
    const post = await createPost({
      title: 'My First Post',
      content: [],
    });

    // Post should have an ID
    expect(post.id).toBeDefined();
    expect(post.title).toBe('My First Post');

    // Should be able to retrieve it
    const retrieved = await getPost(post.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.title).toBe('My First Post');
    expect(retrieved.id).toBe(post.id);
  });

  it('should auto-generate slug from title', async () => {
    const post = await createPost({
      title: 'My First Blog Post',
      content: [],
    });

    expect(post.slug).toBe('my-first-blog-post');
  });

  it('should handle special characters in slug generation', async () => {
    const post = await createPost({
      title: 'Hello, World! This is a Test.',
      content: [],
    });

    expect(post.slug).toBe('hello-world-this-is-a-test');
  });

  it('should handle multiple spaces in slug generation', async () => {
    const post = await createPost({
      title: 'Too    Many     Spaces',
      content: [],
    });

    expect(post.slug).toBe('too-many-spaces');
  });

  it('should update a post', async () => {
    // Create a post
    const post = await createPost({
      title: 'Original Title',
      content: [{ type: 'paragraph', data: { text: 'Original content' } }],
    });

    const originalUpdatedAt = post.updatedAt;

    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the post
    const updated = await updatePost(post.id, {
      title: 'Updated Title',
      content: [{ type: 'paragraph', data: { text: 'Updated content' } }],
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.content[0].data.text).toBe('Updated content');
    expect(updated.slug).toBe('updated-title'); // Slug should update too
    expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);

    // Verify it's persisted
    const retrieved = await getPost(post.id);
    expect(retrieved.title).toBe('Updated Title');
    expect(retrieved.slug).toBe('updated-title');
  });

  it('should update only specified fields', async () => {
    // Create a post
    const post = await createPost({
      title: 'Original Title',
      content: [{ type: 'paragraph', data: { text: 'Original content' } }],
    });

    // Update only content, not title
    const updated = await updatePost(post.id, {
      content: [{ type: 'paragraph', data: { text: 'New content' } }],
    });

    expect(updated.title).toBe('Original Title'); // Title unchanged
    expect(updated.slug).toBe('original-title'); // Slug unchanged
    expect(updated.content[0].data.text).toBe('New content'); // Content updated
  });

  it('should list all posts', async () => {
    // Create multiple posts
    await createPost({ title: 'Post 1', content: [] });
    await createPost({ title: 'Post 2', content: [] });
    await createPost({ title: 'Post 3', content: [] });

    const posts = await listPosts();

    expect(posts).toHaveLength(3);
  });

  it('should list posts sorted by most recently updated first', async () => {
    // Create posts with delays to ensure different timestamps
    const post1 = await createPost({ title: 'First Post', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));

    const post2 = await createPost({ title: 'Second Post', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));

    const post3 = await createPost({ title: 'Third Post', content: [] });

    const posts = await listPosts();

    // Should be sorted by updatedAt descending (most recent first)
    expect(posts[0].title).toBe('Third Post');
    expect(posts[1].title).toBe('Second Post');
    expect(posts[2].title).toBe('First Post');
  });

  it('should filter posts by status', async () => {
    // Create draft posts
    await createPost({ title: 'Draft 1', content: [] });
    await createPost({ title: 'Draft 2', content: [] });

    // Create published post
    const published = await createPost({ title: 'Published Post', content: [] });
    await updatePost(published.id, { status: 'published' });

    // Get only drafts
    const drafts = await listPosts({ status: 'draft' });
    expect(drafts).toHaveLength(2);
    expect(drafts.every(p => p.status === 'draft')).toBe(true);

    // Get only published
    const publishedPosts = await listPosts({ status: 'published' });
    expect(publishedPosts).toHaveLength(1);
    expect(publishedPosts[0].title).toBe('Published Post');
  });

  it('should support all post statuses: draft, published, trashed, pending', async () => {
    const draft = await createPost({ title: 'Draft', content: [] });
    expect(draft.status).toBe('draft');

    const published = await createPost({ title: 'Published', content: [] });
    await updatePost(published.id, { status: 'published' });
    expect((await getPost(published.id)).status).toBe('published');

    const trashed = await createPost({ title: 'Trashed', content: [] });
    await updatePost(trashed.id, { status: 'trashed' });
    expect((await getPost(trashed.id)).status).toBe('trashed');

    const pending = await createPost({ title: 'Pending', content: [] });
    await updatePost(pending.id, { status: 'pending' });
    expect((await getPost(pending.id)).status).toBe('pending');
  });

  it('should soft delete a post by moving it to trash', async () => {
    const post = await createPost({ title: 'Post to Delete', content: [] });

    // Soft delete (trash) the post
    await deletePost(post.id);

    // Post should still exist in database
    const retrieved = await getPost(post.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.status).toBe('trashed');

    // Should not appear in default listing
    const allPosts = await listPosts();
    expect(allPosts.find(p => p.id === post.id)).toBeUndefined();

    // Should appear when filtering for trashed
    const trashedPosts = await listPosts({ status: 'trashed' });
    expect(trashedPosts.find(p => p.id === post.id)).toBeDefined();
  });

  it('should permanently delete a post', async () => {
    const post = await createPost({ title: 'Post to Permanently Delete', content: [] });

    // Permanently delete
    await deletePost(post.id, { permanent: true });

    // Post should not exist in database
    const retrieved = await getPost(post.id);
    expect(retrieved).toBeUndefined();
  });

  it('should exclude trashed posts from default listing', async () => {
    // Create regular posts
    await createPost({ title: 'Active Draft', content: [] });
    const published = await createPost({ title: 'Active Published', content: [] });
    await updatePost(published.id, { status: 'published' });

    // Create and trash a post
    const trashed = await createPost({ title: 'Trashed Post', content: [] });
    await deletePost(trashed.id);

    // Default listing should exclude trashed
    const allPosts = await listPosts();
    expect(allPosts).toHaveLength(2);
    expect(allPosts.every(p => p.status !== 'trashed')).toBe(true);
  });

  it('should set post status and update publishedAt when publishing', async () => {
    const post = await createPost({ title: 'Draft Post', content: [] });

    // Initially draft with no publishedAt
    expect(post.status).toBe('draft');
    expect(post.publishedAt).toBeNull();

    // Publish the post
    const published = await setStatus(post.id, 'published');

    expect(published.status).toBe('published');
    expect(published.publishedAt).toBeDefined();
    expect(published.publishedAt).toBeGreaterThan(0);
  });

  it('should clear publishedAt when unpublishing', async () => {
    const post = await createPost({ title: 'Post', content: [] });

    // Publish first
    await setStatus(post.id, 'published');
    const published = await getPost(post.id);
    expect(published.publishedAt).toBeDefined();

    // Move back to draft (unpublish)
    const unpublished = await setStatus(post.id, 'draft');

    expect(unpublished.status).toBe('draft');
    expect(unpublished.publishedAt).toBeNull();
  });

  it('should handle status transitions between all statuses', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });

    // Draft -> Pending
    let updated = await setStatus(post.id, 'pending');
    expect(updated.status).toBe('pending');

    // Pending -> Published
    updated = await setStatus(post.id, 'published');
    expect(updated.status).toBe('published');
    expect(updated.publishedAt).toBeDefined();

    // Published -> Trashed
    updated = await setStatus(post.id, 'trashed');
    expect(updated.status).toBe('trashed');
    expect(updated.publishedAt).toBeNull(); // Cleared when trashed

    // Trashed -> Draft (restore)
    updated = await setStatus(post.id, 'draft');
    expect(updated.status).toBe('draft');
  });

  it('should throw error for invalid status', async () => {
    const post = await createPost({ title: 'Test Post', content: [] });

    await expect(setStatus(post.id, 'invalid-status')).rejects.toThrow();
  });

  it('should get the most recent post', async () => {
    // Create posts with delays to ensure different timestamps
    const post1 = await createPost({ title: 'First Post', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));

    const post2 = await createPost({ title: 'Second Post', content: [] });
    await new Promise(resolve => setTimeout(resolve, 10));

    const post3 = await createPost({ title: 'Third Post', content: [] });

    const mostRecent = await getMostRecentPost();

    expect(mostRecent).toBeDefined();
    expect(mostRecent.title).toBe('Third Post');
    expect(mostRecent.id).toBe(post3.id);
  });

  it('should return undefined when no posts exist', async () => {
    const mostRecent = await getMostRecentPost();
    expect(mostRecent).toBeUndefined();
  });

  it('should exclude trashed posts when getting most recent', async () => {
    // Create and trash a post
    const trashed = await createPost({ title: 'Trashed Post', content: [] });
    await deletePost(trashed.id);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create a draft post
    const draft = await createPost({ title: 'Draft Post', content: [] });

    const mostRecent = await getMostRecentPost();

    expect(mostRecent).toBeDefined();
    expect(mostRecent.title).toBe('Draft Post');
    expect(mostRecent.id).toBe(draft.id);
  });
});
