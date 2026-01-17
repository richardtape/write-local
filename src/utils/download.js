/**
 * Download utility - trigger file downloads from Blobs
 */

/**
 * Download a Blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export function downloadBlob(blob, filename) {
  // Create object URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL
  URL.revokeObjectURL(url);
}
