import { listPosts } from '../core/storage.js';

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
 * @param {Function} options.onNewPost - Callback when "New Post" is clicked
 * @param {Function} options.onPostSelect - Callback when a post is selected
 * @param {Function} options.onDelete - Callback when a post is deleted
 * @param {Function} options.onViewTrash - Callback when "View Trash" is clicked
 * @param {string} options.currentPostId - ID of currently active post
 */
export async function renderPostList(container, options = {}) {
  const { onNewPost, onPostSelect, onDelete, onViewTrash, currentPostId } = options;

  // Store current filter state
  if (!container._currentFilter) {
    container._currentFilter = 'all';
  }

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
  if (newPostBtn && onNewPost) {
    newPostBtn.addEventListener('click', onNewPost);
  }

  // Get all posts and count by status
  const allPosts = await listPosts();
  const draftPosts = await listPosts({ status: 'draft' });
  const publishedPosts = await listPosts({ status: 'published' });

  // Create filter buttons
  const filterBar = document.createElement('div');
  filterBar.className = 'post-list-filters';
  filterBar.innerHTML = `
    <button class="filter-btn ${container._currentFilter === 'all' ? 'active' : ''}" data-filter="all">
      All (${allPosts.length})
    </button>
    <button class="filter-btn ${container._currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">
      Drafts (${draftPosts.length})
    </button>
    <button class="filter-btn ${container._currentFilter === 'published' ? 'active' : ''}" data-filter="published">
      Published (${publishedPosts.length})
    </button>
  `;
  container.appendChild(filterBar);

  // Add click handlers for filter buttons
  const filterButtons = filterBar.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      container._currentFilter = btn.dataset.filter;
      await renderPostList(container, options);
    });
  });

  // Get posts based on current filter
  let posts;
  if (container._currentFilter === 'all') {
    posts = allPosts;
  } else {
    posts = await listPosts({ status: container._currentFilter });
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

    // Build delete button HTML if callback provided
    const deleteButtonHTML = onDelete
      ? '<button class="btn-delete-post" data-action="delete-post" title="Delete post">×</button>'
      : '';

    postItem.innerHTML = `
      <div class="post-item-content">
        <div class="post-item-title">${post.title}</div>
        <div class="post-item-meta">
          <span class="post-status status-${post.status}">${post.status}</span>
          <span class="post-updated">Updated ${formatRelativeTime(post.updatedAt)}</span>
        </div>
      </div>
      ${deleteButtonHTML}
    `;

    // Add click handler for post selection
    if (onPostSelect) {
      postItem.addEventListener('click', (e) => {
        // Only select if not clicking delete button
        if (!e.target.closest('[data-action="delete-post"]')) {
          onPostSelect(post.id);
        }
      });
    }

    // Add click handler for delete button
    if (onDelete) {
      const deleteButton = postItem.querySelector('[data-action="delete-post"]');
      if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent post selection
          onDelete(post.id);
        });
      }
    }

    postsList.appendChild(postItem);
  });

  container.appendChild(postsList);

  // Add trash button at the bottom
  if (onViewTrash) {
    const trashButton = document.createElement('div');
    trashButton.className = 'trash-button-container';
    trashButton.innerHTML = `
      <button class="btn-view-trash" data-action="view-trash">
        🗑️ View Trash
      </button>
    `;

    const btn = trashButton.querySelector('[data-action="view-trash"]');
    btn.addEventListener('click', onViewTrash);

    container.appendChild(trashButton);
  }
}
