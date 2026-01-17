import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from './download.js';

describe('download utility', () => {
  let createObjectURLMock;
  let revokeObjectURLMock;
  let appendChildMock;
  let removeChildMock;
  let clickMock;

  beforeEach(() => {
    // Mock URL methods
    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    // Mock DOM methods
    clickMock = vi.fn();
    appendChildMock = vi.fn();
    removeChildMock = vi.fn();

    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildMock);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL from the blob', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });

    downloadBlob(blob, 'test.txt');

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
  });

  it('creates a download link with correct attributes', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });

    // Capture the created element
    let createdLink;
    appendChildMock.mockImplementation((el) => {
      createdLink = el;
    });

    downloadBlob(blob, 'my-file.zip');

    expect(createdLink.tagName).toBe('A');
    expect(createdLink.href).toBe('blob:mock-url');
    expect(createdLink.download).toBe('my-file.zip');
  });

  it('triggers click on the download link', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });

    let createdLink;
    appendChildMock.mockImplementation((el) => {
      createdLink = el;
      el.click = clickMock;
    });

    downloadBlob(blob, 'test.txt');

    expect(clickMock).toHaveBeenCalled();
  });

  it('cleans up by removing the link and revoking URL', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });

    let createdLink;
    appendChildMock.mockImplementation((el) => {
      createdLink = el;
      el.click = clickMock;
    });

    downloadBlob(blob, 'test.txt');

    expect(removeChildMock).toHaveBeenCalledWith(createdLink);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });
});
