import { listPosts, createPost, deletePost } from '../core/storage.js';

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Render the post list component
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Configuration options
 * @param {Router} options.router - Router instance for navigation
 * @param {string} options.filter - Current filter ('all', 'draft', 'published')
 * @param {string} options.currentPostId - ID of currently active post
 */
export async function renderPostList(container, options = {}) {
  const { router, filter = 'all', currentPostId } = options;

  // Clear container
  container.innerHTML = '';

  // Create header with "New Post" button
  const header = document.createElement('div');
  header.className = 'post-list-header';
  header.innerHTML = `
    <h2>Posts</h2>
    <button class="btn-new-post" data-action="new-post">+ New Post</button>
  `;
  container.appendChild(header);

  // Add click handler for "New Post" button
  const newPostBtn = header.querySelector('[data-action="new-post"]');
  newPostBtn.addEventListener('click', async () => {
    // Clear the editor and title
    if (window.editor) {
      await window.editor.clear();
    }
    const titleInput = document.getElementById('post-title');
    if (titleInput) {
      titleInput.value = '';
    }

    // Create a new post
    const newPost = await createPost({
      title: 'Untitled',
      content: { blocks: [] },
    });

    // Set the autoSave to track this new post
    if (window.autoSave) {
      window.autoSave.postId = newPost.id;
    }

    // Navigate to posts view (which will refresh the list)
    router.navigate('/posts');

    // Focus the title input
    if (titleInput) {
      titleInput.focus();
    }
  });

  // Get all posts and count by status
  const allPosts = await listPosts();
  const draftPosts = await listPosts({ status: 'draft' });
  const publishedPosts = await listPosts({ status: 'published' });

  // Create filter buttons
  const filterBar = document.createElement('div');
  filterBar.className = 'post-list-filters';
  filterBar.innerHTML = `
    <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">
      All (${allPosts.length})
    </button>
    <button class="filter-btn ${filter === 'draft' ? 'active' : ''}" data-filter="draft">
      Drafts (${draftPosts.length})
    </button>
    <button class="filter-btn ${filter === 'published' ? 'active' : ''}" data-filter="published">
      Published (${publishedPosts.length})
    </button>
  `;
  container.appendChild(filterBar);

  // Add click handlers for filter buttons
  const filterButtons = filterBar.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedFilter = btn.dataset.filter;
      if (selectedFilter === 'all') {
        router.navigate('/posts');
      } else if (selectedFilter === 'draft') {
        router.navigate('/posts/drafts');
      } else if (selectedFilter === 'published') {
        router.navigate('/posts/published');
      }
    });
  });

  // Get posts based on current filter
  let posts;
  if (filter === 'all') {
    posts = allPosts;
  } else {
    posts = await listPosts({ status: filter });
  }

  // Create posts list container
  const postsList = document.createElement('div');
  postsList.className = 'posts-list';

  // Show empty state if no posts
  if (posts.length === 0) {
    postsList.innerHTML = '<div class="empty-state">No posts yet</div>';
    container.appendChild(postsList);
    return;
  }

  // Render each post
  posts.forEach(post => {
    const postItem = document.createElement('div');
    postItem.className = `post-item ${post.id === currentPostId ? 'active' : ''}`;

    postItem.innerHTML = `
      <div class="post-item-content">
        <div class="post-item-title">${post.title}</div>
        <div class="post-item-meta">
          <span class="post-status status-${post.status}">${post.status}</span>
          <span class="post-updated">Updated ${formatRelativeTime(post.updatedAt)}</span>
        </div>
      </div>
      <button class="btn-delete-post" data-action="delete-post" title="Delete post">×</button>
    `;

    // Add click handler for post selection
    postItem.addEventListener('click', (e) => {
      // Only select if not clicking delete button
      if (!e.target.closest('[data-action="delete-post"]')) {
        router.navigate(`/posts/${post.id}`);
      }
    });

    // Add click handler for delete button
    const deleteButton = postItem.querySelector('[data-action="delete-post"]');
    deleteButton.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent post selection

      // Soft delete (move to trash)
      await deletePost(post.id);

      // If we deleted the currently active post, clear the editor and load another
      if (window.autoSave && window.autoSave.postId === post.id) {
        // Clear editor and title
        if (window.editor) {
          await window.editor.clear();
        }
        const titleInput = document.getElementById('post-title');
        if (titleInput) {
          titleInput.value = '';
        }
        window.autoSave.postId = null;

        // Try to load the most recent post
        const allPostsAfterDelete = await listPosts();
        if (allPostsAfterDelete.length > 0) {
          await window.autoSave.load(allPostsAfterDelete[0].id);
        }
      }

      // Refresh current view
      router.handleRoute();
    });

    postsList.appendChild(postItem);
  });

  container.appendChild(postsList);

  // Add footer buttons (trash and settings)
  const footerButtons = document.createElement('div');
  footerButtons.className = 'post-list-footer';
  footerButtons.innerHTML = `
    <button class="btn-view-trash" data-action="view-trash">
      🗑️ View Trash
    </button>
    <button class="btn-settings" data-action="settings">
      ⚙️ Settings
    </button>
  `;

  const trashBtn = footerButtons.querySelector('[data-action="view-trash"]');
  trashBtn.addEventListener('click', () => {
    router.navigate('/trash');
  });

  const settingsBtn = footerButtons.querySelector('[data-action="settings"]');
  settingsBtn.addEventListener('click', () => {
    router.navigate('/settings');
  });

  container.appendChild(footerButtons);
}
