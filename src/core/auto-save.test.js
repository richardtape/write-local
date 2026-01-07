import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db, getPost } from './storage.js';
import { AutoSave } from './auto-save.js';

describe('AutoSave', () => {
  let mockTitleInput;

  beforeEach(async () => {
    await db.delete();
    await db.open();

    // Create a mock title input element
    mockTitleInput = document.createElement('input');
    mockTitleInput.value = 'Test Post Title';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a new post on first save', async () => {
    const mockEditor = {
      save: vi.fn().mockResolvedValue({
        blocks: [{ type: 'paragraph', data: { text: 'Test content' } }],
      }),
    };

    mockTitleInput.value = 'My First Post';
    const autoSave = new AutoSave(mockEditor, mockTitleInput);

    // Trigger save
    await autoSave.save();

    // Should have created a post
    expect(autoSave.postId).toBeDefined();

    const post = await getPost(autoSave.postId);
    expect(post).toBeDefined();
    expect(post.title).toBe('My First Post'); // Title from input element
    expect(post.content).toEqual({
      blocks: [{ type: 'paragraph', data: { text: 'Test content' } }],
    });
  });

  it('should update existing post on subsequent saves', async () => {
    const mockEditor = {
      save: vi.fn()
        .mockResolvedValueOnce({
          blocks: [{ type: 'paragraph', data: { text: 'First save' } }],
        })
        .mockResolvedValueOnce({
          blocks: [{ type: 'paragraph', data: { text: 'Second save' } }],
        }),
    };

    mockTitleInput.value = 'Updated Title';
    const autoSave = new AutoSave(mockEditor, mockTitleInput);

    // First save
    await autoSave.save();
    const postId = autoSave.postId;

    // Update title and save again
    mockTitleInput.value = 'Second Title';
    await autoSave.save();

    // Should still be the same post
    expect(autoSave.postId).toBe(postId);

    const post = await getPost(postId);
    expect(post.title).toBe('Second Title');
    expect(post.content).toEqual({
      blocks: [{ type: 'paragraph', data: { text: 'Second save' } }],
    });
  });

  it('should debounce saves with 500ms delay', async () => {
    vi.useFakeTimers(); // Only use fake timers for this test

    const mockEditor = {
      save: vi.fn().mockResolvedValue({
        blocks: [{ type: 'paragraph', data: { text: 'Content' } }],
      }),
    };

    const autoSave = new AutoSave(mockEditor, mockTitleInput);

    // Trigger multiple saves rapidly
    autoSave.scheduleSave();
    autoSave.scheduleSave();
    autoSave.scheduleSave();

    // Should not have saved yet
    expect(mockEditor.save).not.toHaveBeenCalled();

    // Fast forward 499ms - still shouldn't save
    vi.advanceTimersByTime(499);
    expect(mockEditor.save).not.toHaveBeenCalled();

    // Fast forward to 500ms - should save once
    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();

    expect(mockEditor.save).toHaveBeenCalledTimes(1);

    vi.useRealTimers(); // Restore real timers after this test
  });

  it('should use title from input field', async () => {
    const mockEditor = {
      save: vi.fn().mockResolvedValue({
        blocks: [
          { type: 'paragraph', data: { text: 'Content here' } },
        ],
      }),
    };

    mockTitleInput.value = 'My Custom Title';
    const autoSave = new AutoSave(mockEditor, mockTitleInput);
    await autoSave.save();

    const post = await getPost(autoSave.postId);
    expect(post.title).toBe('My Custom Title');
  });

  it('should use "Untitled" if title input is empty', async () => {
    const mockEditor = {
      save: vi.fn().mockResolvedValue({ blocks: [] }),
    };

    mockTitleInput.value = '';
    const autoSave = new AutoSave(mockEditor, mockTitleInput);
    await autoSave.save();

    const post = await getPost(autoSave.postId);
    expect(post.title).toBe('Untitled');
  });

  it('should emit status events during save', async () => {
    const mockEditor = {
      save: vi.fn().mockResolvedValue({
        blocks: [{ type: 'paragraph', data: { text: 'Test' } }],
      }),
    };

    const autoSave = new AutoSave(mockEditor, mockTitleInput);
    const onStatusChange = vi.fn();
    autoSave.on('statusChange', onStatusChange);

    await autoSave.save();

    expect(onStatusChange).toHaveBeenCalledWith('saving');
    expect(onStatusChange).toHaveBeenCalledWith('saved');
  });

  it('should load a post into the editor and title field', async () => {
    const editorData = {
      blocks: [
        { type: 'paragraph', data: { text: 'Loaded content' } },
      ],
    };

    const mockEditor = {
      save: vi.fn().mockResolvedValue(editorData),
      render: vi.fn().mockResolvedValue(undefined),
    };

    mockTitleInput.value = 'Original Title';
    const autoSave = new AutoSave(mockEditor, mockTitleInput);

    // First, save a post
    await autoSave.save();
    const postId = autoSave.postId;

    // Create new title input and AutoSave instance (simulating page reload)
    const newTitleInput = document.createElement('input');
    const newAutoSave = new AutoSave(mockEditor, newTitleInput);

    // Load the post
    await newAutoSave.load(postId);

    // Should have set the postId
    expect(newAutoSave.postId).toBe(postId);

    // Should have set the title in the input field
    expect(newTitleInput.value).toBe('Original Title');

    // Should have rendered the content
    expect(mockEditor.render).toHaveBeenCalledWith(editorData);
  });
});

