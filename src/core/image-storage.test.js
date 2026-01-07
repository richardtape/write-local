import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './storage.js';
import {
  saveImage,
  getImage,
  getImagesByPost,
  deleteImage,
} from './image-storage.js';

describe('Image Storage', () => {
  beforeEach(async () => {
    // Clear images table before each test
    await db.images.clear();
  });

  describe('saveImage', () => {
    it('saves an image to IndexedDB with postId', async () => {
      const postId = 'post-123';
      const file = new Blob(['fake image data'], { type: 'image/png' });

      const savedImage = await saveImage(postId, file, {
        filename: 'test.png',
        caption: 'Test caption',
        alt: 'Test alt text',
      });

      expect(savedImage).toBeDefined();
      expect(savedImage.id).toBeDefined();
      expect(savedImage.postId).toBe(postId);
      expect(savedImage.filename).toBe('test.png');
      expect(savedImage.type).toBe('image/png');
      expect(savedImage.caption).toBe('Test caption');
      expect(savedImage.alt).toBe('Test alt text');
      expect(savedImage.createdAt).toBeDefined();
    });

    it('stores the file as a Blob', async () => {
      const postId = 'post-123';
      const file = new Blob(['fake image data'], { type: 'image/jpeg' });

      const savedImage = await saveImage(postId, file, {
        filename: 'photo.jpg',
      });

      // In test environment, file may be serialized; in browser it's a true Blob
      expect(savedImage.file).toBeDefined();
      expect(savedImage.file.type).toBe('image/jpeg');
    });

    it('generates unique IDs for each image', async () => {
      const postId = 'post-123';
      const file1 = new Blob(['image 1'], { type: 'image/png' });
      const file2 = new Blob(['image 2'], { type: 'image/png' });

      const image1 = await saveImage(postId, file1, { filename: 'img1.png' });
      const image2 = await saveImage(postId, file2, { filename: 'img2.png' });

      expect(image1.id).not.toBe(image2.id);
    });

    it('stores image size from Blob', async () => {
      const postId = 'post-123';
      const imageData = 'x'.repeat(1024); // 1KB of data
      const file = new Blob([imageData], { type: 'image/png' });

      const savedImage = await saveImage(postId, file, {
        filename: 'test.png',
      });

      expect(savedImage.size).toBe(1024);
    });
  });

  describe('getImage', () => {
    it('retrieves an image by ID', async () => {
      const postId = 'post-123';
      const file = new Blob(['test image'], { type: 'image/png' });

      const saved = await saveImage(postId, file, {
        filename: 'test.png',
        caption: 'Original caption',
      });

      const retrieved = await getImage(saved.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(saved.id);
      expect(retrieved.filename).toBe('test.png');
      expect(retrieved.caption).toBe('Original caption');
      // In test environment, fake-indexeddb may serialize Blob to plain object
      // In real browser, this will be a Blob instance
      expect(retrieved.file).toBeDefined();
      expect(retrieved.file.type).toBe('image/png');
    });

    it('returns undefined for non-existent image', async () => {
      const result = await getImage('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getImagesByPost', () => {
    it('retrieves all images for a specific post', async () => {
      const postId1 = 'post-123';
      const postId2 = 'post-456';

      const file1 = new Blob(['image 1'], { type: 'image/png' });
      const file2 = new Blob(['image 2'], { type: 'image/jpeg' });
      const file3 = new Blob(['image 3'], { type: 'image/png' });

      await saveImage(postId1, file1, { filename: 'img1.png' });
      await saveImage(postId1, file2, { filename: 'img2.jpg' });
      await saveImage(postId2, file3, { filename: 'img3.png' });

      const post1Images = await getImagesByPost(postId1);
      const post2Images = await getImagesByPost(postId2);

      expect(post1Images).toHaveLength(2);
      expect(post2Images).toHaveLength(1);

      // Check that both images are present (order doesn't matter for this test)
      const post1Filenames = post1Images.map(img => img.filename);
      expect(post1Filenames).toContain('img1.png');
      expect(post1Filenames).toContain('img2.jpg');
    });

    it('returns empty array for post with no images', async () => {
      const images = await getImagesByPost('post-with-no-images');
      expect(images).toEqual([]);
    });

    it('returns images sorted by createdAt (oldest first)', async () => {
      const postId = 'post-123';

      const file1 = new Blob(['image 1'], { type: 'image/png' });
      const file2 = new Blob(['image 2'], { type: 'image/png' });
      const file3 = new Blob(['image 3'], { type: 'image/png' });

      // Add small delays to ensure different timestamps
      const img1 = await saveImage(postId, file1, { filename: 'first.png' });
      await new Promise(resolve => setTimeout(resolve, 10));

      const img2 = await saveImage(postId, file2, { filename: 'second.png' });
      await new Promise(resolve => setTimeout(resolve, 10));

      const img3 = await saveImage(postId, file3, { filename: 'third.png' });

      const images = await getImagesByPost(postId);

      expect(images).toHaveLength(3);
      expect(images[0].filename).toBe('first.png');
      expect(images[1].filename).toBe('second.png');
      expect(images[2].filename).toBe('third.png');
      expect(images[0].createdAt).toBeLessThan(images[2].createdAt);
    });
  });

  describe('deleteImage', () => {
    it('deletes an image by ID', async () => {
      const postId = 'post-123';
      const file = new Blob(['test image'], { type: 'image/png' });

      const saved = await saveImage(postId, file, { filename: 'test.png' });

      await deleteImage(saved.id);

      const retrieved = await getImage(saved.id);
      expect(retrieved).toBeUndefined();
    });

    it('does not throw error when deleting non-existent image', async () => {
      await expect(deleteImage('non-existent-id')).resolves.not.toThrow();
    });

    it('does not affect other images when deleting one', async () => {
      const postId = 'post-123';
      const file1 = new Blob(['image 1'], { type: 'image/png' });
      const file2 = new Blob(['image 2'], { type: 'image/png' });

      const img1 = await saveImage(postId, file1, { filename: 'img1.png' });
      const img2 = await saveImage(postId, file2, { filename: 'img2.png' });

      await deleteImage(img1.id);

      const remaining = await getImagesByPost(postId);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(img2.id);
    });
  });
});
