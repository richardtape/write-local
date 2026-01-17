import { createPost, updatePost } from './storage.js';

/**
 * AutoSave handles automatic saving of editor content to IndexedDB
 */
export class AutoSave {
  constructor(editor, titleElement, options = {}) {
    this.editor = editor;
    this.titleElement = titleElement;
    this.postId = null;
    this.saveTimeout = null;
    this.debounceDelay = options.debounceDelay || 500;
    this.listeners = new Map();
  }

  /**
   * Event emitter for status changes
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit an event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  /**
   * Schedule a save with debouncing
   */
  scheduleSave() {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    this.saveTimeout = setTimeout(() => {
      this.save();
    }, this.debounceDelay);
  }

  /**
   * Get title from input field
   */
  getTitle() {
    const titleValue = this.titleElement ? this.titleElement.value.trim() : '';
    return titleValue || 'Untitled';
  }

  /**
   * Save editor content to storage
   */
  async save() {
    try {
      this.emit('statusChange', 'saving');

      // Get current editor content
      const editorData = await this.editor.save();

      // Get title from input field
      const title = this.getTitle();

      // Sync alt text from image blocks to IndexedDB
      await this.syncImageMetadata(editorData);

      if (this.postId) {
        // Update existing post
        await updatePost(this.postId, {
          title,
          content: editorData,
        });
      } else {
        // Create new post
        const post = await createPost({
          title,
          content: editorData,
        });
        this.postId = post.id;
      }

      this.emit('statusChange', 'saved');
    } catch (error) {
      this.emit('statusChange', 'error');
      console.error('Auto-save failed:', error);
      throw error;
    }
  }

  /**
   * Sync image metadata (alt text, caption) from EditorJS blocks to IndexedDB
   * @param {Object} editorData - Editor content data
   */
  async syncImageMetadata(editorData) {
    const { updateImage } = await import('./image-storage.js');

    if (!editorData.blocks) return;

    for (const block of editorData.blocks) {
      if (block.type === 'image' && block.data.file?.imageId) {
        const imageId = block.data.file.imageId;
        const caption = block.data.caption || '';
        const alt = block.tunes?.altText?.alt || '';

        // Update image metadata in IndexedDB
        await updateImage(imageId, { alt, caption });
      }
    }
  }

  /**
   * Load a post into the editor
   */
  async load(postId) {
    const { getPost } = await import('./storage.js');
    const { getImage } = await import('./image-storage.js');
    const { optimizeImage } = await import('../utils/image-optimizer.js');

    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post with id ${postId} not found`);
    }

    this.postId = postId;

    // Set the title in the input field
    if (this.titleElement) {
      this.titleElement.value = post.title;
    }

    // Process image blocks to create optimized previews
    if (post.content && post.content.blocks) {
      for (const block of post.content.blocks) {
        if (block.type === 'image' && block.data.file?.imageId) {
          // Fetch the ORIGINAL image Blob from IndexedDB
          const image = await getImage(block.data.file.imageId);

          if (image && image.file) {
            // Create OPTIMIZED preview for editor display
            // TODO: Use theme's maxImageWidth when themes are implemented
            const optimizedBlob = await optimizeImage(image.file, {
              maxWidth: 1200,
              maxHeight: 1200,
              quality: 0.85,
              format: 'webp',
            });

            // Create Object URL from optimized version
            const objectURL = URL.createObjectURL(optimizedBlob);

            // Update the block's URL
            block.data.file.url = objectURL;
          }
        }
      }
    }

    // Render the post content in the editor
    await this.editor.render(post.content);

    // Emit loaded status
    this.emit('statusChange', 'loaded');
  }

  /**
   * Clean up timers
   */
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}
