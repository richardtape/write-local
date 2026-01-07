/**
 * Alt Text Tune for EditorJS Image Blocks
 * Adds an accessible alt text field for WCAG AA compliance
 */
export class AltTextTune {
  /**
   * @param {object} api - EditorJS API
   * @param {object} data - Tune data (alt text value)
   * @param {object} config - Tune config
   * @param {object} block - Block API
   */
  constructor({ api, data, config, block }) {
    this.api = api;
    this.data = data || {};
    this.config = config || {};
    this.block = block;
    this.wrapper = null;
    this.input = null;
  }

  /**
   * Tune is a block tune (appears in block settings)
   */
  static get isTune() {
    return true;
  }

  /**
   * Render the tune UI
   * @returns {HTMLElement}
   */
  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      padding: 10px;
      background: #f9f9fb;
      border-radius: 4px;
      margin: 10px 0;
    `;

    const label = document.createElement('label');
    label.textContent = 'Alt Text (for screen readers):';
    label.style.cssText = `
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 5px;
      color: #707684;
    `;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Describe this image for accessibility';
    this.input.value = this.data.alt || '';
    this.input.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #e4e4eb;
      border-radius: 3px;
      font-size: 13px;
      box-sizing: border-box;
    `;

    // Update data when input changes
    this.input.addEventListener('input', () => {
      this.data.alt = this.input.value;
    });

    const hint = document.createElement('div');
    hint.textContent = '💡 Good alt text describes the image content and function';
    hint.style.cssText = `
      font-size: 11px;
      color: #9b9faa;
      margin-top: 5px;
      font-style: italic;
    `;

    this.wrapper.appendChild(label);
    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(hint);

    return this.wrapper;
  }

  /**
   * Save tune data
   * @returns {object} Saved data
   */
  save() {
    return {
      alt: this.input ? this.input.value : this.data.alt || '',
    };
  }

  /**
   * Wrap method - allows tune to wrap the block content
   * We'll use this to add the alt attribute to the actual <img> tag
   * @param {HTMLElement} blockContent - The block's content element
   * @returns {HTMLElement}
   */
  wrap(blockContent) {
    // Find the img tag and add alt attribute
    const img = blockContent.querySelector('img');
    if (img) {
      const altText = this.data.alt || '';
      img.setAttribute('alt', altText);

      // Add visual indicator if alt text is missing
      if (!altText) {
        img.style.outline = '2px dashed #ffa726';
        img.title = 'Missing alt text - please add for accessibility';
      } else {
        img.style.outline = 'none';
        img.title = altText;
      }
    }

    return blockContent;
  }
}
