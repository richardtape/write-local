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
 * Render the trash view component
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Configuration options
 * @param {Router} options.router - Router instance for navigation
 * @param {Function} options.onRestore - Callback when a post is restored
 * @param {Function} options.onDeletePermanent - Callback when a post is permanently deleted
 * @param {Function} options.onPostSelect - Callback when a post is selected to view
 */
export async function renderTrashView(container, options = {}) {
  const { router, onRestore, onDeletePermanent, onPostSelect } = options;

  // Clear container
  container.innerHTML = '';

  // Get trashed posts
  const trashedPosts = await listPosts({ status: 'trashed' });
  const itemCount = trashedPosts.length;
  const itemText = itemCount === 1 ? 'item' : 'items';

  // Create header
  const header = document.createElement('div');
  header.className = 'trash-view-header';
  header.innerHTML = `
    <button class="btn-close-trash" data-action="close-trash" title="Back to posts">← Back</button>
    <h2>Trash</h2>
    <span class="trash-count">${itemCount} ${itemText}</span>
  `;
  container.appendChild(header);

  // Add click handler for close button
  const closeBtn = header.querySelector('[data-action="close-trash"]');
  closeBtn.addEventListener('click', () => {
    router.navigate('/posts');
  });

  // Create trash list container
  const trashList = document.createElement('div');
  trashList.className = 'trash-list';

  // Show empty state if no trashed posts
  if (trashedPosts.length === 0) {
    trashList.innerHTML = '<div class="empty-state">Trash is empty</div>';
    container.appendChild(trashList);
    return;
  }

  // Render each trashed post
  trashedPosts.forEach(post => {
    const trashItem = document.createElement('div');
    trashItem.className = 'trash-item';

    trashItem.innerHTML = `
      <div class="trash-item-content">
        <div class="trash-item-title">${post.title}</div>
        <div class="trash-item-meta">
          <span class="trash-item-deleted">Deleted ${formatRelativeTime(post.updatedAt)}</span>
        </div>
        <div class="trash-item-actions">
          <button class="btn-restore" data-action="restore" title="Restore post">Restore</button>
          <button class="btn-delete-permanent" data-action="delete-permanent" title="Delete permanently">Delete Forever</button>
        </div>
      </div>
    `;

    // Add click handler for viewing post content
    if (onPostSelect) {
      const contentDiv = trashItem.querySelector('.trash-item-content');
      contentDiv.style.cursor = 'pointer';

      contentDiv.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (!e.target.closest('button')) {
          onPostSelect(post.id);
        }
      });
    }

    // Add click handler for restore button
    if (onRestore) {
      const restoreBtn = trashItem.querySelector('[data-action="restore"]');
      if (restoreBtn) {
        restoreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onRestore(post.id);
        });
      }
    }

    // Add click handler for delete permanently button
    if (onDeletePermanent) {
      const deleteBtn = trashItem.querySelector('[data-action="delete-permanent"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onDeletePermanent(post.id);
        });
      }
    }

    trashList.appendChild(trashItem);
  });

  container.appendChild(trashList);
}
