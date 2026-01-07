/**
 * Calculate optimized dimensions for an image while maintaining aspect ratio
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {{ width: number, height: number }} Optimized dimensions
 */
export function calculateDimensions(
  originalWidth,
  originalHeight,
  maxWidth,
  maxHeight
) {
  // Don't upscale images - return original size if smaller
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return {
      width: originalWidth,
      height: originalHeight,
    };
  }

  // Calculate scale factor based on both width and height constraints
  const widthScale = maxWidth / originalWidth;
  const heightScale = maxHeight / originalHeight;

  // Use the smaller scale to ensure both dimensions fit within constraints
  const scale = Math.min(widthScale, heightScale);

  // Calculate new dimensions (maintaining aspect ratio)
  const width = Math.floor(originalWidth * scale);
  const height = Math.floor(originalHeight * scale);

  return { width, height };
}

/**
 * Optimize an image using Canvas API
 * - Resize to fit within max dimensions (maintains aspect ratio)
 * - Convert to specified format (WebP or JPEG)
 * - Apply quality compression
 *
 * @param {Blob} blob - Original image Blob
 * @param {Object} options - Optimization options
 * @param {number} [options.maxWidth=2000] - Maximum width in pixels
 * @param {number} [options.maxHeight=2000] - Maximum height in pixels
 * @param {number} [options.quality=0.85] - Quality (0-1, where 1 is highest)
 * @param {string} [options.format='webp'] - Output format ('webp' or 'jpeg')
 * @returns {Promise<Blob>} Optimized image Blob
 */
export async function optimizeImage(blob, options = {}) {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.85,
    format = 'webp',
  } = options;

  // Validation
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid blob provided');
  }

  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be between 0 and 1');
  }

  try {
    // Load image from Blob
    const imageBitmap = await createImageBitmap(blob);

    // Calculate optimized dimensions
    const { width, height } = calculateDimensions(
      imageBitmap.width,
      imageBitmap.height,
      maxWidth,
      maxHeight
    );

    // Create canvas with optimized dimensions
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Draw resized image on canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convert to Blob with specified format and quality
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (optimizedBlob) => {
          if (optimizedBlob) {
            resolve(optimizedBlob);
          } else {
            reject(new Error('Failed to create optimized blob'));
          }
        },
        mimeType,
        quality
      );
    });
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
}
