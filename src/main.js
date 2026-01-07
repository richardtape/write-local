// Write Local - Main entry point
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import ImageTool from '@editorjs/image';
import { AutoSave } from './core/auto-save.js';
import { Router } from './core/router.js';
import { renderPostList } from './components/post-list.js';
import { renderTrashView } from './components/trash-view.js';
import { renderSettingsView } from './components/settings-view.js';
import { createPost, getMostRecentPost, deletePost, setStatus } from './core/storage.js';
import { loadTheme, getDefaultTheme } from './core/theme-engine.js';
import { saveImage } from './core/image-storage.js';
import { AltTextTune } from './blocks/alt-text-tune.js';
import { optimizeImage } from './utils/image-optimizer.js';

// (Save status indicator removed - keeping UI minimal)

// Helper: Remove the current/last block (used when image upload fails)
function removeCurrentBlock() {
  if (!window.editor?.blocks) return;

  try {
    // Get the current block index
    const blocksCount = window.editor.blocks.getBlocksCount();

    if (blocksCount > 0) {
      // Remove the last block (the failed image block)
      window.editor.blocks.delete(blocksCount - 1);
    }
  } catch (error) {
    console.error('Failed to remove block:', error);
  }
}

// Initialize EditorJS
const editor = new EditorJS({
  holder: 'editorjs',

  // Auto-focus on the editor
  autofocus: true,

  // Placeholder text
  placeholder: 'Start writing or type / for commands...',

  // Available tools
  tools: {
    // Block Tunes (settings for blocks)
    altText: {
      class: AltTextTune,
    },
    paragraph: {
      class: Paragraph,
      inlineToolbar: ['bold', 'italic', 'link'],
    },
    header: {
      class: Header,
      inlineToolbar: ['bold', 'italic', 'link'],
      config: {
        placeholder: 'Enter a heading',
        levels: [1, 2, 3, 4, 5, 6],
        defaultLevel: 2,
      },
    },
    list: {
      class: List,
      inlineToolbar: ['bold', 'italic', 'link'],
      config: {
        defaultStyle: 'unordered',
      },
    },
    image: {
      class: ImageTool,
      tunes: ['altText'], // Enable alt text tune for accessibility
      config: {
        /**
         * Custom uploader - saves images to IndexedDB
         */
        uploader: {
          /**
           * Upload file to IndexedDB
           * @param {File} file - Image file from file picker
           * @returns {Promise<Object>} Upload result with Object URL
           */
          uploadByFile(file) {
            return new Promise(async (resolve, reject) => {
              // Helper: Suppress EditorJS's default error notification
              const suppressDefaultError = (errorMsg, callback) => {
                const originalShow = window.editor.notifier.show;

                // Temporarily override notifier to suppress default error
                window.editor.notifier.show = () => {};

                // Wait for EditorJS to process the failed upload and try to show error
                // Then show our custom error and restore notifier
                setTimeout(() => {
                  // Show our custom error message (while notifier is still suppressed)
                  originalShow.call(window.editor.notifier, {
                    message: errorMsg,
                    style: 'error',
                  });

                  // Restore original notifier after showing our message
                  window.editor.notifier.show = originalShow;

                  // Remove the failed image block
                  removeCurrentBlock();

                  if (callback) callback();
                }, 200); // Increased delay to let EditorJS's error attempt complete
              };

              try {
                // Get current post ID from autoSave instance
                // Note: This will be available after editor is ready
                const postId = window.autoSave?.postId;

                if (!postId) {
                  const errorMsg = 'No active post. Please create a post first.';
                  suppressDefaultError(errorMsg);
                  resolve({ success: 0 });
                  return;
                }

                // Validation: Check file type
                if (!file.type.startsWith('image/')) {
                  const errorMsg = `Invalid file type. Please select an image file (JPEG, PNG, GIF, WebP, etc.).`;
                  suppressDefaultError(errorMsg);
                  resolve({ success: 0 });
                  return;
                }

                // Validation: Check file size (max 10MB)
                const maxSizeMB = 10;
                const maxSizeBytes = maxSizeMB * 1024 * 1024; // 10MB in bytes

                if (file.size > maxSizeBytes) {
                  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                  const errorMsg = `Image too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB. Please compress or resize first.`;
                  suppressDefaultError(errorMsg);
                  resolve({ success: 0 });
                  return;
                }

                // Save ORIGINAL image to IndexedDB (unoptimized)
                const savedImage = await saveImage(postId, file, {
                  filename: file.name,
                  alt: '',
                  caption: '',
                });

                // Create OPTIMIZED preview for display in editor
                // Default: 1200px max (will be theme-configurable later)
                const optimizedBlob = await optimizeImage(file, {
                  maxWidth: 1200,
                  maxHeight: 1200,
                  quality: 0.85,
                  format: 'webp',
                });

                // Create Object URL from optimized version
                const objectURL = URL.createObjectURL(optimizedBlob);

                // Return result in EditorJS format
                resolve({
                  success: 1,
                  file: {
                    url: objectURL,
                    // Store image ID for later reference
                    imageId: savedImage.id,
                    filename: savedImage.filename,
                  },
                });
              } catch (error) {
                console.error('Error uploading image:', error);
                const errorMsg = error.message || 'Failed to upload image. Please try again.';
                suppressDefaultError(errorMsg);
                resolve({ success: 0 });
              }
            });
          },
        },
        // Field for caption
        captionPlaceholder: 'Enter caption (optional)',
        // Show UI for file button
        buttonContent: 'Select an image',
        // File types
        types: 'image/*',
        // Additional config
        additionalRequestHeaders: {},
      },
    },
  },

  // Default block
  defaultBlock: 'paragraph',

  // Logging
  onReady: async () => {
    console.log('EditorJS is ready!');

    // Load default theme for editor preview
    const defaultTheme = await getDefaultTheme();
    await loadTheme(defaultTheme);
    console.log('Loaded default theme:', defaultTheme);

    // Get title input element
    const titleInput = document.getElementById('post-title');

    // Initialize auto-save with title element
    const autoSave = new AutoSave(editor, titleInput);

    // Initialize router
    const router = new Router();

    // Add event listener to title input for auto-save
    titleInput.addEventListener('input', () => {
      autoSave.scheduleSave();
    });

    // Listen for status changes (minimal - only refresh list on save)
    autoSave.on('statusChange', async (status) => {
      if (status === 'saved') {
        // Refresh current view after save
        router.handleRoute();
      }
    });

    // Helper: Render post list with current filter
    async function renderPosts(filter = 'all') {
      const sidebar = document.getElementById('post-list-sidebar');
      await renderPostList(sidebar, {
        currentPostId: autoSave.postId,
        filter,
        router, // Pass router to component
      });
    }

    // Helper: Render trash view
    async function renderTrash() {
      const sidebar = document.getElementById('post-list-sidebar');
      await renderTrashView(sidebar, {
        router, // Pass router to component
        onRestore: async (postId) => {
          await setStatus(postId, 'draft');
          router.handleRoute(); // Refresh view
        },
        onDeletePermanent: async (postId) => {
          const confirmed = window.confirm(
            'Are you sure you want to permanently delete this post? This cannot be undone.'
          );
          if (confirmed) {
            await deletePost(postId, { permanent: true });
            router.handleRoute(); // Refresh view
          }
        },
        onPostSelect: async (postId) => {
          await autoSave.load(postId);
        },
      });
    }

    // Route: All posts
    router.on('/posts', async () => {
      await renderPosts('all');

      // Auto-load most recent post if nothing is currently loaded
      if (!autoSave.postId) {
        const mostRecent = await getMostRecentPost();
        if (mostRecent) {
          console.log('Loading most recent post:', mostRecent.title);
          await autoSave.load(mostRecent.id);
        }
      }
    });

    // Route: Drafts filter
    router.on('/posts/drafts', async () => {
      await renderPosts('draft');
    });

    // Route: Published filter
    router.on('/posts/published', async () => {
      await renderPosts('published');
    });

    // Route: Specific post (dynamic)
    router.on('/posts/:id', async ({ id }) => {
      await autoSave.load(id);
      await renderPosts('all'); // Render list with this post active
    });

    // Route: Trash view
    router.on('/trash', async () => {
      await renderTrash();
    });

    // Route: Settings
    router.on('/settings', async () => {
      const sidebar = document.getElementById('post-list-sidebar');
      await renderSettingsView(sidebar, { router });
    });

    // Route: Root - redirect to /posts
    router.on('/', async () => {
      router.navigate('/posts', { replace: true });
    });

    // Not found handler
    router.onNotFound((path) => {
      console.warn('Route not found:', path);
      router.navigate('/posts', { replace: true });
    });

    // Make instances accessible for debugging
    window.autoSave = autoSave;
    window.router = router;

    // Start the router (handle initial route)
    // This will trigger the appropriate route handler based on current URL
    router.handleRoute();
  },

  onChange: (api, event) => {
    // Trigger auto-save on content change
    if (window.autoSave) {
      window.autoSave.scheduleSave();
    }
  },
});

// Make editor globally accessible for debugging
window.editor = editor;
