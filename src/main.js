// Write Local - Main entry point

// Handle OAuth callback if we're in a popup
import { handleOAuthCallback } from './publisher/netlify-oauth.js';

if (window.opener && window.location.hash.includes('access_token')) {
  // We're in a popup and have an OAuth callback
  const result = handleOAuthCallback(window.location.hash);

  // Send result to opener
  window.opener.postMessage({
    type: 'oauth-callback',
    platform: 'netlify',
    ...result,
  }, window.location.origin);

  // Close the popup
  window.close();

  // Stop executing the rest of the app
  throw new Error('OAuth callback handled - closing popup');
}

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
import { renderPublishView } from './components/publish-view.js';
import { renderPostThemeSelector, updatePostThemeSelector } from './components/post-theme-selector.js';
import { createPost, getMostRecentPost, getPost, deletePost, setStatus } from './core/storage.js';
import { loadTheme, getDefaultTheme } from './core/theme-engine.js';
import { saveImage } from './core/image-storage.js';
import { AltTextTune } from './blocks/alt-text-tune.js';
import { optimizeImage } from './utils/image-optimizer.js';
import { createExportBundle } from './exporter/bundler.js';
import { downloadBlob } from './utils/download.js';

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

    // Initialize post theme selector
    const themeSelectorContainer = document.getElementById('post-theme-selector-container');
    await renderPostThemeSelector(themeSelectorContainer, {
      postId: null, // Initially no post loaded
      onChange: (theme) => {
        // Trigger auto-save when theme changes
        autoSave.scheduleSave();
      },
    });

    // Add event listener to title input for auto-save
    titleInput.addEventListener('input', () => {
      autoSave.scheduleSave();
    });

    // Export button setup (defined early so it can be used in statusChange handler)
    const exportBtn = document.getElementById('btn-export');

    function updateExportButton() {
      if (autoSave.postId) {
        exportBtn.disabled = false;
      } else {
        exportBtn.disabled = true;
      }
    }

    // Listen for status changes
    autoSave.on('statusChange', async (status) => {
      if (status === 'saved') {
        // Only refresh the post list, NOT the full route (which would reload the editor)
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/posts') && !currentPath.startsWith('/posts/')) {
          // On /posts, /posts/drafts, /posts/published - refresh the list
          const filter = currentPath === '/posts/drafts' ? 'draft'
            : currentPath === '/posts/published' ? 'published'
            : 'all';
          await renderPosts(filter);
        } else if (currentPath.startsWith('/posts/')) {
          // On /posts/:id - just refresh the sidebar, don't reload the post
          await renderPosts('all');
        }
      }

      if (status === 'loaded') {
        // Update theme selector when post is loaded
        await updatePostThemeSelector(themeSelectorContainer, {
          postId: autoSave.postId,
        });
      }

      // Update export button state on any status change
      updateExportButton();
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

    // Route: Publish
    router.on('/publish', async () => {
      const sidebar = document.getElementById('post-list-sidebar');
      await renderPublishView(sidebar, {
        router,
        postId: autoSave.postId,
      });
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

    // Handle publish button click
    const publishBtn = document.getElementById('btn-publish');
    publishBtn.addEventListener('click', () => {
      if (!autoSave.postId) {
        alert('Please create or select a post first.');
        return;
      }
      router.navigate('/publish');
    });

    // Handle export button click
    exportBtn.addEventListener('click', async () => {
      if (!autoSave.postId) return;

      try {
        // Update button state
        exportBtn.disabled = true;
        exportBtn.textContent = 'Exporting...';
        exportBtn.classList.add('exporting');

        // Save current content before exporting
        await autoSave.save();

        // Get post for filename
        const post = await getPost(autoSave.postId);
        const filename = `${post.slug || 'post'}.zip`;

        // Create and download the export bundle
        const zipBlob = await createExportBundle(autoSave.postId);
        downloadBlob(zipBlob, filename);

        // Reset button state
        exportBtn.textContent = 'Export ZIP';
        exportBtn.classList.remove('exporting');
        updateExportButton();
      } catch (error) {
        console.error('Export failed:', error);
        exportBtn.textContent = 'Export Failed';
        setTimeout(() => {
          exportBtn.textContent = 'Export ZIP';
          exportBtn.classList.remove('exporting');
          updateExportButton();
        }, 2000);
      }
    });

    // Start the router (handle initial route)
    // This will trigger the appropriate route handler based on current URL
    await router.handleRoute();

    // Update export button after initial load
    updateExportButton();
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
