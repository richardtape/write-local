# Write Local - Offline-First Blog Writing App
## Comprehensive Implementation Plan

> **📋 Implementation Status**: This document contains the complete architectural plan and roadmap. For **actual implementation progress, current status, and development decisions**, see **[PROGRESS.md](./PROGRESS.md)**.

---

## 1. Project Overview

**Write Local** is a browser-based, offline-first blog writing application that prioritizes a fast, beautiful writing experience with minimal friction. The app allows users to write blog posts locally using a block-based editor, store content offline, and publish to static HTML when online.

### Core Principles
- **Performance First**: Zero latency writing experience
- **Offline-First**: Full functionality without internet connection
- **Beautiful & Minimal**: Typography-focused design
- **Simple Theming**: CSS-only themes (CSS Zen Garden approach)
- **Static Output**: Generate deployable HTML files

---

## 2. Technology Stack

### 2.1 Frontend Framework
**Choice: Vanilla JavaScript + Vite**

**Rationale:**
- Maximum performance (no framework overhead)
- Full control over rendering and updates
- Vite provides excellent DX with fast builds
- Easier to keep bundle size minimal
- Direct DOM manipulation for critical writing paths

**Alternative Considered:** React/Preact
- Rejected due to framework overhead impacting writing performance
- Would add unnecessary complexity for theming system

### 2.2 Block Editor
**Choice: EditorJS**

**Rationale:**
- **Block-native architecture**: Perfect match for requirements
- **Clean JSON output**: Easy to store, version, and export
- **Simple API**: Fast integration and customization
- **Extensible**: Custom blocks for YouTube embeds, etc.
- **Lightweight**: ~150KB core bundle
- **Performance**: Optimized for fast typing experience

**Key Features:**
- Built-in blocks: paragraph, headings, lists, quotes, code, images
- Custom blocks needed: YouTube embed, spacer
- Clean JSON data structure
- Easy to render to static HTML

**Alternative Considered:** TipTap
- More powerful but uses continuous document model (not block-based)
- Higher complexity for our use case
- Larger bundle size with all features

### 2.3 Offline Storage
**Choice: IndexedDB (via Dexie.js)**

**Rationale:**
- **Asynchronous**: Won't block main thread (critical for performance)
- **Large storage**: No 5MB limit like localStorage
- **Structured data**: Perfect for blog post objects
- **Service worker compatible**: Can sync in background
- **Dexie.js**: Excellent wrapper with clean API and TypeScript support

**Data Structure:**
```javascript
{
  posts: {
    id: 'uuid',
    title: 'string',
    slug: 'string',
    content: [], // EditorJS JSON blocks
    theme: 'string', // theme ID
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
    publishedAt: 'timestamp | null',
    status: 'draft | published'
  },
  images: {
    id: 'uuid',
    postId: 'uuid', // Foreign key to posts
    file: Blob, // Original image file
    filename: 'string',
    type: 'string', // MIME type
    size: 'number', // bytes
    width: 'number',
    height: 'number',
    caption: 'string',
    alt: 'string',
    createdAt: 'timestamp'
  },
  themes: {
    id: 'string',
    name: 'string',
    css: 'string', // Full CSS content
    isDefault: 'boolean'
  },
  settings: {
    key: 'string',
    value: 'any'
  }
}
```

### 2.4 Build Tool
**Choice: Vite**

**Rationale:**
- Lightning-fast HMR during development
- Optimized production builds
- Native ES modules support
- Simple configuration
- Excellent TypeScript support

### 2.5 Styling Approach
**Choice: CSS Custom Properties + PostCSS**

**Rationale:**
- CSS variables perfect for theming
- No runtime CSS-in-JS overhead
- Simple for theme authors
- PostCSS for vendor prefixes and optimizations
- Native CSS nesting support

### 2.6 Testing Strategy
**Choice: Test-Driven Development (TDD) with Vitest**

**Philosophy:**
We'll build Write Local using **Test-Driven Development** (TDD), following the Red-Green-Refactor cycle:
1. **🔴 Red**: Write a failing test first
2. **🟢 Green**: Write minimal code to make the test pass
3. **🔵 Refactor**: Improve code quality without changing behavior

**Rationale:**
- **Quality First**: Tests written before code ensure better design
- **Living Documentation**: Tests document how code should work
- **Confidence**: Refactor fearlessly with comprehensive test coverage
- **Fast Feedback**: Vitest provides instant feedback during development
- **Prevention**: Catch bugs before they reach users

**Testing Tools:**

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@testing-library/dom": "^10.0.0",
    "@testing-library/user-event": "^14.5.0",
    "happy-dom": "^15.0.0",
    "fake-indexeddb": "^6.0.0",
    "msw": "^2.0.0"
  }
}
```

**Tool Breakdown:**

| Tool | Purpose | Why |
|------|---------|-----|
| **Vitest** | Test runner | Vite-native, incredibly fast, Jest-compatible API |
| **@vitest/ui** | Test UI | Beautiful browser UI for tests |
| **@testing-library/dom** | DOM testing | Test UI components from user perspective |
| **@testing-library/user-event** | User interaction | Simulate realistic user interactions |
| **happy-dom** | DOM environment | Lightweight DOM implementation for tests |
| **fake-indexeddb** | IndexedDB mock | In-memory IndexedDB for testing storage |
| **MSW** | API mocking | Mock network requests for publishing features |

**Test Structure:**

```
write-local/
├── src/
│   ├── core/
│   │   ├── storage.js
│   │   └── storage.test.js      # Unit tests alongside source
│   ├── exporter/
│   │   ├── html-generator.js
│   │   └── html-generator.test.js
│   └── utils/
│       ├── slug.js
│       └── slug.test.js
├── tests/
│   ├── setup.ts                 # Global test setup
│   ├── integration/             # Integration tests
│   │   ├── post-workflow.test.js
│   │   ├── export-workflow.test.js
│   │   └── theme-workflow.test.js
│   └── e2e/                     # End-to-end tests (optional)
│       └── writing-flow.test.js
└── vitest.config.js
```

**Test Categories:**

**1. Unit Tests** (80% of tests)
- Pure functions and utilities
- Individual modules in isolation
- Fast, focused, deterministic

**Examples:**
```javascript
// src/utils/slug.test.js
import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('Hello    World')).toBe('hello-world');
  });
});
```

**2. Integration Tests** (15% of tests)
- Multiple modules working together
- Storage + business logic
- Export system end-to-end

**Examples:**
```javascript
// tests/integration/post-workflow.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/core/storage';
import { createPost, savePost, getPost } from '../../src/core/posts';

describe('Post Workflow', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('creates and retrieves a post', async () => {
    const post = await createPost({ title: 'Test Post' });
    expect(post.id).toBeDefined();

    const retrieved = await getPost(post.id);
    expect(retrieved.title).toBe('Test Post');
  });

  it('auto-generates slug from title', async () => {
    const post = await createPost({ title: 'My First Post' });
    expect(post.slug).toBe('my-first-post');
  });
});
```

**3. Component Tests** (5% of tests)
- UI components with user interactions
- DOM assertions

**Examples:**
```javascript
// src/components/post-list.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { renderPostList } from './post-list';
import { db } from '../core/storage';

describe('PostList Component', () => {
  beforeEach(async () => {
    await db.posts.clear();
    await db.posts.bulkAdd([
      { id: '1', title: 'Post 1', status: 'draft' },
      { id: '2', title: 'Post 2', status: 'published' }
    ]);
  });

  it('renders list of posts', async () => {
    await renderPostList(document.body);
    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.getByText('Post 2')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    await renderPostList(document.body);
    await userEvent.click(screen.getByText('Drafts'));
    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.queryByText('Post 2')).not.toBeInTheDocument();
  });
});
```

**Test Coverage Requirements:**

| Area | Minimum Coverage | Target Coverage |
|------|------------------|-----------------|
| **Core (storage, router)** | 90% | 100% |
| **Exporter (HTML, Markdown)** | 85% | 95% |
| **Utils** | 90% | 100% |
| **Blocks (custom)** | 80% | 90% |
| **Components** | 70% | 85% |
| **Overall** | 80% | 90% |

**Vitest Configuration:**

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.config.js'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    // Watch mode: only run tests related to changed files
    watch: true,
    // Parallel test execution
    threads: true,
    // Fail fast on first error (useful for TDD)
    bail: 1
  }
});
```

**Test Setup (IndexedDB):**

```typescript
// tests/setup.ts
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Polyfill IndexedDB for tests
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// Mock URL.createObjectURL for image tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Reset database between tests
import { beforeEach } from 'vitest';
import { db } from '../src/core/storage';

beforeEach(async () => {
  await db.delete();
  await db.open();
});
```

**TDD Workflow Example:**

**Feature: Generate slug from post title**

**Step 1: 🔴 Red - Write failing test**
```javascript
// src/utils/slug.test.js
import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });
});
```

Run: `npm run test` → ❌ FAIL (function doesn't exist)

**Step 2: 🟢 Green - Write minimal code**
```javascript
// src/utils/slug.js
export function generateSlug(title) {
  return title.toLowerCase().replace(/\s+/g, '-');
}
```

Run: `npm run test` → ✅ PASS

**Step 3: 🔵 Refactor - Improve**
```javascript
// Add more test cases
it('removes special characters', () => {
  expect(generateSlug('Hello, World!')).toBe('hello-world');
});
```

Run: `npm run test` → ❌ FAIL

```javascript
// Improve implementation
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces
    .replace(/-+/g, '-')       // Collapse hyphens
    .trim();
}
```

Run: `npm run test` → ✅ PASS

**Benefits for Write Local:**

1. **Confidence in Storage**: Tests ensure IndexedDB operations are reliable
2. **Export Quality**: Tests validate HTML/Markdown output is correct
3. **Image Handling**: Tests verify Blob storage and optimization work
4. **Regression Prevention**: Changes don't break existing features
5. **Faster Development**: Less time debugging, more time building
6. **Better Design**: TDD forces modular, testable architecture

**Testing Commands:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

## 3. Architecture Design

### 3.1 Application Structure

```
write-local/
├── src/
│   ├── core/
│   │   ├── editor.js           # EditorJS initialization
│   │   ├── editor.test.js      # ✅ Unit tests
│   │   ├── storage.js          # Dexie database setup
│   │   ├── storage.test.js     # ✅ Unit tests
│   │   ├── router.js           # Simple hash-based routing
│   │   ├── router.test.js      # ✅ Unit tests
│   │   ├── theme-engine.js     # Theme loading and switching
│   │   └── theme-engine.test.js # ✅ Unit tests
│   ├── components/
│   │   ├── post-list.js        # Posts listing view
│   │   ├── post-list.test.js   # ✅ Component tests
│   │   ├── post-editor.js      # Main editor view
│   │   ├── post-editor.test.js # ✅ Component tests
│   │   ├── theme-selector.js   # Theme picker component
│   │   ├── theme-selector.test.js # ✅ Component tests
│   │   ├── publish-modal.js    # Static HTML export UI
│   │   └── publish-modal.test.js # ✅ Component tests
│   ├── blocks/
│   │   ├── youtube-embed.js    # Custom EditorJS block
│   │   ├── youtube-embed.test.js # ✅ Unit tests
│   │   ├── spacer.js           # Custom spacing block
│   │   └── spacer.test.js      # ✅ Unit tests
│   ├── exporter/
│   │   ├── html-generator.js   # Render EditorJS to HTML
│   │   ├── html-generator.test.js # ✅ Unit tests
│   │   ├── markdown-generator.js # Render EditorJS to Markdown
│   │   ├── markdown-generator.test.js # ✅ Unit tests
│   │   ├── template.js         # HTML template structure
│   │   ├── template.test.js    # ✅ Unit tests
│   │   ├── bundler.js          # Bundle HTML + CSS + assets (ZIP)
│   │   ├── bundler.test.js     # ✅ Integration tests
│   │   ├── image-optimizer.js  # Optimize images for export
│   │   └── image-optimizer.test.js # ✅ Unit tests
│   ├── themes/
│   │   ├── default.css         # Default minimal theme
│   │   ├── serif.css           # Alternative serif theme
│   │   └── base.css            # Shared base styles
│   ├── styles/
│   │   ├── app.css             # App UI styles (not content)
│   │   ├── typography.css      # Type scale system
│   │   └── variables.css       # CSS custom properties
│   ├── utils/
│   │   ├── slug.js             # URL slug generation
│   │   ├── slug.test.js        # ✅ Unit tests
│   │   ├── date.js             # Date formatting
│   │   ├── date.test.js        # ✅ Unit tests
│   │   ├── download.js         # File download helpers
│   │   └── download.test.js    # ✅ Unit tests
│   └── main.js                 # App entry point
├── tests/
│   ├── setup.ts                # Global test setup (IndexedDB, mocks)
│   ├── integration/            # Integration tests
│   │   ├── post-workflow.test.js    # Create → Edit → Save → Retrieve
│   │   ├── export-workflow.test.js  # Export → ZIP → HTML + Markdown
│   │   ├── theme-workflow.test.js   # Theme → Apply → Export
│   │   └── image-workflow.test.js   # Upload → Store → Optimize → Export
│   └── e2e/                    # End-to-end tests (optional)
│       └── writing-flow.test.js     # Full user journey
├── public/
│   └── themes/                 # User-added themes
├── dist/                       # Build output
├── index.html
├── vite.config.js
├── vitest.config.js            # ✅ Test configuration
└── package.json
```

### 3.2 Theme System Architecture

**Design Goals:**
- CSS-only themes (no JavaScript required)
- Per-post theme selection
- Live preview when writing
- CSS Zen Garden philosophy

**Implementation:**

1. **Base CSS Variables** (in content, not app UI):
```css
:root {
  /* Typography Scale (Minor Third: 1.2) */
  --font-size-base: 1rem;      /* 16px */
  --font-size-sm: 0.833rem;    /* 13.33px */
  --font-size-lg: 1.2rem;      /* 19.2px */
  --font-size-xl: 1.44rem;     /* 23.04px */
  --font-size-2xl: 1.728rem;   /* 27.65px */
  --font-size-3xl: 2.074rem;   /* 33.18px */
  --font-size-4xl: 2.488rem;   /* 39.81px */

  /* Spacing (based on type scale) */
  --space-xs: 0.833rem;
  --space-sm: 1rem;
  --space-md: 1.2rem;
  --space-lg: 1.44rem;
  --space-xl: 1.728rem;
  --space-2xl: 2.074rem;
  --space-3xl: 2.488rem;

  /* Content Width */
  --content-max-width: 65ch;

  /* Colors */
  --color-text: #1a1a1a;
  --color-text-light: #4a4a4a;
  --color-background: #ffffff;
  --color-accent: #0066cc;

  /* Fonts */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-heading: var(--font-family-base);
  --font-family-mono: 'SF Mono', Monaco, monospace;

  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 1.8;
}
```

2. **Theme Structure**:
Each theme is a single CSS file that overrides these variables:

```css
/* themes/serif.css */
:root {
  --font-family-base: 'Georgia', 'Times New Roman', serif;
  --font-family-heading: 'Playfair Display', serif;
  --color-text: #2a2a2a;
  --line-height-normal: 1.7;
}
```

3. **Theme Application**:
```javascript
// Load theme CSS dynamically
function applyTheme(themeId) {
  const existingTheme = document.getElementById('active-theme');
  if (existingTheme) existingTheme.remove();

  const link = document.createElement('link');
  link.id = 'active-theme';
  link.rel = 'stylesheet';
  link.href = `/themes/${themeId}.css`;
  document.head.appendChild(link);
}
```

4. **Content CSS Isolation**:
```html
<!-- Writing interface -->
<div class="app-ui">...</div>

<!-- Content preview (themed) -->
<article class="post-content">
  <!-- EditorJS content rendered here -->
  <!-- Only this section is affected by themes -->
</article>
```

### 3.3 Typography System

**Minor Third Scale (1.2 ratio):**
```
14px  → 0.875rem (--font-size-xs)
16px  → 1rem     (--font-size-base)
19px  → 1.2rem   (--font-size-lg)
23px  → 1.44rem  (--font-size-xl)
28px  → 1.728rem (--font-size-2xl)
33px  → 2.074rem (--font-size-3xl)
40px  → 2.488rem (--font-size-4xl)
```

**Responsive Fluid Typography:**
```css
:root {
  /* Fluid type scale using clamp() */
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.2rem, 1.08rem + 0.6vw, 1.35rem);
  --font-size-xl: clamp(1.44rem, 1.296rem + 0.72vw, 1.62rem);
  --font-size-2xl: clamp(1.728rem, 1.555rem + 0.864vw, 1.944rem);
  --font-size-3xl: clamp(2.074rem, 1.866rem + 1.037vw, 2.333rem);
  --font-size-4xl: clamp(2.488rem, 2.239rem + 1.244vw, 2.799rem);
}
```

**Block Styles:**
```css
.post-content {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.post-content h1 {
  font-size: var(--font-size-4xl);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-lg);
}

.post-content h2 {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-tight);
  margin-top: var(--space-2xl);
  margin-bottom: var(--space-md);
}

.post-content p {
  font-size: var(--font-size-base);
  line-height: var(--line-height-loose);
  margin-bottom: var(--space-md);
}

.post-content img {
  max-width: 100%;
  height: auto;
  margin: var(--space-xl) 0;
}
```

### 3.4 Static HTML & Markdown Export

#### Image Handling Strategy ✅ IMPLEMENTED

**Actual Implementation (src/core/image-storage.js + src/main.js):**
```javascript
// User adds image via EditorJS @editorjs/image block
// Custom uploader in src/main.js

// Validation (10MB max, image types only)
if (!file.type.startsWith('image/')) { /* show error */ }
if (file.size > 10 * 1024 * 1024) { /* show error */ }

// Store ORIGINAL Blob in IndexedDB (unoptimized)
const savedImage = await saveImage(postId, file, {
  filename: file.name,
  alt: '',      // Set via AltTextTune Block Tune
  caption: ''   // Set via EditorJS caption field
});

// Create OPTIMIZED preview for editor display
const optimizedBlob = await optimizeImage(file, {
  maxWidth: 1200,    // TODO: Theme-configurable
  maxHeight: 1200,
  quality: 0.85,
  format: 'webp'
});

// Create Object URL from optimized version
const objectURL = URL.createObjectURL(optimizedBlob);

// Return to EditorJS
resolve({
  success: 1,
  file: {
    url: objectURL,
    imageId: savedImage.id,    // Reference to IndexedDB
    filename: savedImage.filename
  }
});
```

**Alt Text Accessibility (WCAG AA Compliance):**
- AltTextTune Block Tune (src/blocks/alt-text-tune.js)
- Visual indicator (orange outline) when alt text missing
- Alt text synced to IndexedDB during auto-save
- Applied to actual `<img>` tag via `wrap()` method

**Performance Benefits:**
- ✅ Originals preserved for future re-optimization
- ✅ On-demand optimization based on context (editor vs export)
- ✅ No blocking of main thread (async operations)
- ✅ Works in all browsers (100% support)
- ✅ Full offline capability
- ✅ WebP optimization (30-70% size reduction)

**On Export - Image Optimization:** ✅ IMPLEMENTED (src/utils/image-optimizer.js)
```javascript
// ACTUAL IMPLEMENTATION - Ready for export integration
import { calculateDimensions, optimizeImage } from './utils/image-optimizer.js';

// Calculate dimensions maintaining aspect ratio (12 tests passing)
const { width, height } = calculateDimensions(
  originalWidth, originalHeight, maxWidth, maxHeight
);

// Optimize with Canvas API (browser-tested via test-optimization.html)
async function optimizeImage(blob, options = {}) {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.85,
    format = 'webp'
  } = options;

  // Validation
  if (!blob || !(blob instanceof Blob)) throw new Error('Invalid blob');
  if (quality < 0 || quality > 1) throw new Error('Quality must be between 0 and 1');

  // Load image
  const imageBitmap = await createImageBitmap(blob);

  // Calculate dimensions (maintain aspect ratio, no upscaling)
  const { width, height } = calculateDimensions(
    imageBitmap.width, imageBitmap.height, maxWidth, maxHeight
  );

  // Resize on canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Convert to optimized format (WebP)
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

// Usage in export system:
// 1. Fetch original from IndexedDB: await getImage(imageId)
// 2. Re-optimize for export: await optimizeImage(image.file, { maxWidth: 2000, ... })
// 3. Add to ZIP: zip.file(`images/${filename}`, optimizedBlob)
```

**Export Process:**

**1. ZIP Export (Recommended - Default)**
```
my-blog-post.zip
├── index.html          # Clean HTML with relative image paths
├── index.md            # Markdown version
├── images/
│   ├── image-1.webp    # Optimized images
│   └── image-2.webp
└── css/
    └── theme.css       # Theme styles
```

**HTML Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <link rel="stylesheet" href="./css/theme.css">
</head>
<body>
  <article class="post-content">
    <h1>${post.title}</h1>
    ${renderedBlocks}
  </article>
</body>
</html>
```

**Markdown Template:**
```markdown
# ${post.title}

${renderedMarkdownBlocks}
```

**2. Single-File HTML Export (Optional)**
- Small images (<10KB) as base64
- Warning about performance impact
- Use case: Email newsletters, portable archives

**Block Rendering to HTML:**
```javascript
function renderBlockToHTML(block, images) {
  switch (block.type) {
    case 'paragraph':
      return `<p>${block.data.text}</p>`;
    case 'header':
      return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
    case 'image':
      const image = images.find(img => img.id === block.data.imageId);
      return `<img src="./images/${image.filename}" alt="${block.data.alt || ''}" />
              ${block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : ''}`;
    case 'embed':
      if (block.data.service === 'youtube') {
        return `<div class="embed-youtube">
          <iframe src="${block.data.embed}" frameborder="0" allowfullscreen></iframe>
        </div>`;
      }
    // ... more block types
  }
}
```

**Block Rendering to Markdown:**
```javascript
function renderBlockToMarkdown(block, images) {
  switch (block.type) {
    case 'paragraph':
      return `${block.data.text}\n\n`;
    case 'header':
      return `${'#'.repeat(block.data.level)} ${block.data.text}\n\n`;
    case 'image':
      const image = images.find(img => img.id === block.data.imageId);
      return `![${block.data.alt || ''}](./images/${image.filename})\n\n`;
    case 'list':
      const marker = block.data.style === 'ordered' ? '1.' : '-';
      return block.data.items.map(item => `${marker} ${item}`).join('\n') + '\n\n';
    case 'quote':
      return `> ${block.data.text}\n\n`;
    case 'code':
      return `\`\`\`${block.data.language || ''}\n${block.data.code}\n\`\`\`\n\n`;
    // ... more block types
  }
}
```

**Export Implementation:**
```javascript
import JSZip from 'jszip';

async function exportAsZip(postId, options = {}) {
  const {
    optimizeImages = true,
    includeMarkdown = true,
    imageQuality = 0.85,
    maxImageWidth = 2000
  } = options;

  // Get post and images from IndexedDB
  const post = await db.posts.get(postId);
  const images = await db.images.where('postId').equals(postId).toArray();
  const theme = await db.themes.get(post.theme);

  // Create ZIP
  const zip = new JSZip();

  // Optimize and add images
  for (const image of images) {
    const optimized = optimizeImages
      ? await optimizeImage(image.file, { maxWidth: maxImageWidth, quality: imageQuality })
      : image.file;

    const filename = optimizeImages
      ? image.filename.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      : image.filename;

    zip.file(`images/${filename}`, optimized);
  }

  // Generate and add HTML
  const htmlContent = generateHTML(post, images, theme);
  zip.file('index.html', htmlContent);

  // Generate and add Markdown
  if (includeMarkdown) {
    const markdownContent = generateMarkdown(post, images);
    zip.file('index.md', markdownContent);
  }

  // Add CSS
  zip.file('css/theme.css', theme.css);

  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });

  // Download
  downloadFile(blob, `${post.slug}.zip`);
}
```

**Performance Comparison:**

| Approach | HTML Size | Total Size | Page Load | Browser Support |
|----------|-----------|------------|-----------|-----------------|
| Base64 (5 images) | 2.5MB | 2.5MB | ~4s | 100% |
| ZIP - Original | 15KB | 1.8MB | ~1.2s | 100% |
| ZIP - Optimized | 15KB | 600KB | ~0.6s | 100% |

**Deployment Options:**
- Download as ZIP (HTML + Markdown + optimized assets)
- Direct deploy to Netlify (via API)
- Direct deploy to Vercel (via API)
- Push to GitHub Pages (via GitHub API)

---

## 4. Performance Optimizations

### 4.1 Writing Performance (Critical Path)

**Goal: Sub-16ms input latency**

**Optimizations:**
1. **Direct DOM manipulation** for editor (no virtual DOM)
2. **Debounced auto-save** (500ms delay)
3. **Async storage operations** (IndexedDB non-blocking)
4. **Lazy load** non-critical features
5. **Code splitting** for export/publish features
6. **Minimal dependencies** in editor bundle

**Bundle Strategy:**
```javascript
// main bundle (< 50KB gzipped)
- Core app shell
- EditorJS core
- Essential blocks
- Storage layer

// Lazy bundles
- Export/publish features
- Theme manager
- Advanced blocks
- Settings panel
```

### 4.2 Initial Load Performance

**Targets:**
- First Paint: < 500ms
- Time to Interactive: < 1s
- Bundle size: < 50KB gzipped (main)

**Techniques:**
- Critical CSS inlined
- Preload editor bundle
- Service worker for offline caching
- Asset compression

### 4.3 Storage Performance

**IndexedDB Optimizations:**
- Index on `updatedAt` for fast sorting
- Index on `status` for filtering drafts/published
- Compound index on `status + updatedAt`
- Batch operations where possible

---

## 5. Custom EditorJS Blocks

### 5.1 YouTube Embed Block

**Features:**
- Paste YouTube URL
- Auto-extract video ID
- Responsive embed (16:9 aspect ratio)
- Thumbnail preview in editor

**Implementation:**
```javascript
class YouTubeEmbed {
  static get toolbox() {
    return {
      title: 'YouTube',
      icon: '<svg>...</svg>'
    };
  }

  render() {
    return createInput({
      placeholder: 'Paste YouTube URL...',
      onPaste: this.handlePaste
    });
  }

  save(blockContent) {
    return {
      url: this.data.url,
      videoId: this.extractVideoId(this.data.url)
    };
  }
}
```

### 5.2 Spacer Block

**Features:**
- Add custom vertical spacing
- Predefined sizes: small, medium, large
- Custom size option

**Usage:**
- Better control over content rhythm
- Emphasize section breaks

---

## 6. User Interface Design

### 6.1 Writing Interface (Minimal)

**Layout:**
```
┌─────────────────────────────────────┐
│ [← Posts] [Theme ▼] [⋮ Menu]       │ ← Minimal header
├─────────────────────────────────────┤
│                                     │
│           [Post Title]              │
│                                     │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   │   EditorJS Content Area    │   │ ← Focus area
│   │   (Max-width: 65ch)        │   │
│   │                            │   │
│   └────────────────────────────┘   │
│                                     │
│                                     │
└─────────────────────────────────────┘
      Auto-save indicator (subtle)
```

**Design Principles:**
- Chrome disappears when writing
- Keyboard shortcuts for all actions
- Distraction-free mode (F11 or Cmd+Shift+F)
- Subtle auto-save indicator
- No visual clutter

### 6.2 Posts List Interface

**Layout:**
```
┌─────────────────────────────────────┐
│ Write Local          [+ New Post]   │
├─────────────────────────────────────┤
│ [All] [Drafts] [Published]          │
├─────────────────────────────────────┤
│                                     │
│  ○ Post Title One                   │
│    Last edited 2 hours ago          │
│    Draft                            │
│                                     │
│  ○ Post Title Two                   │
│    Last edited yesterday            │
│    Published                        │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Quick search/filter
- Sort by date/title
- Visual status indicators
- Keyboard navigation

### 6.3 Theme Selector

**Approach:**
- Dropdown in editor header
- Live preview when hovering
- Apply on selection
- Per-post setting (saved with post)

---

## 7. Implementation Phases (TDD Approach)

**All phases follow Red-Green-Refactor cycle:**
- 🔴 Write failing test first
- 🟢 Write minimal code to pass
- 🔵 Refactor and improve

### Phase 1: Foundation with TDD (Week 1-2) ✅ COMPLETED
**Goal: Basic editor and storage working with comprehensive tests**

**TDD Tasks:**

**Week 1: Core Infrastructure** ✅
1. **Project Setup** ✅
   - ✅ Initialize Vite project
   - ✅ Configure Vitest + testing tools
   - ✅ Set up test directory structure
   - ✅ Create vitest.config.js and tests/setup.js

2. **Utils (TDD)** ✅
   - ✅ 🔴 Write tests for `generateSlug()`
   - ✅ 🟢 Implement slug generation
   - ✅ 🔴 Write tests for date formatting
   - ✅ 🟢 Implement date utilities
   - ✅ 🔵 Refactor for edge cases

3. **Storage Layer (TDD)** ✅
   - ✅ 🔴 Write tests for Dexie setup
   - ✅ 🟢 Initialize IndexedDB schema
   - ✅ 🔴 Write tests for CRUD operations (posts)
   - ✅ 🟢 Implement post storage methods
   - ✅ 🔴 Write tests for queries/indexes
   - ✅ 🟢 Implement efficient queries
   - ✅ 🔵 Refactor with error handling

**Week 2: Editor & UI Components** ✅
4. **Router (TDD)** ⏭️ DEFERRED
   - ⏭️ Hash-based routing deferred to Phase 2
   - Current: View state management (posts/trash)

5. **EditorJS Integration (TDD)** ✅
   - ✅ 🔴 Write tests for editor initialization
   - ✅ 🟢 Integrate EditorJS
   - ✅ 🔴 Write tests for content save/load
   - ✅ 🟢 Implement save/load logic
   - ✅ 🔵 Optimize for performance

6. **Posts Management (TDD)** ✅
   - ✅ 🔴 Write integration tests for post workflow
   - ✅ 🟢 Implement createPost, savePost, getPost
   - ✅ 🔴 Write tests for auto-save
   - ✅ 🟢 Implement debounced auto-save
   - ✅ 🔵 Add error recovery
   - ✅ **ADDED:** Separate title input field

7. **Posts List Component (TDD)** ✅
   - ✅ 🔴 Write component tests for rendering posts (19 tests)
   - ✅ 🟢 Implement posts list UI
   - ✅ 🔴 Write tests for filtering (draft/published)
   - ✅ 🟢 Implement filter functionality
   - ✅ 🔵 Optimize rendering
   - ✅ **ADDED:** Delete button with soft delete
   - ✅ **ADDED:** "New Post" button
   - ✅ **ADDED:** Active post highlighting
   - ✅ **ADDED:** Post switching on click

8. **Trash Management (TDD)** ✅ ADDED
   - ✅ 🔴 Write trash view tests (12 tests)
   - ✅ 🟢 Implement trash view component
   - ✅ Restore posts from trash
   - ✅ Permanent delete with confirmation
   - ✅ Click to view trashed post content
   - ✅ Navigation between posts and trash views

9. **Image Handling (TDD)** ✅ COMPLETED EARLY (Moved from Phase 3)
   - ✅ 🔴 Write tests for image storage in IndexedDB (17 tests)
   - ✅ 🟢 Implement image storage layer (saveImage, getImage, deleteImage)
   - ✅ 🔴 Write tests for image optimization (12 tests)
   - ✅ 🟢 Implement Canvas API optimization (resize + WebP conversion)
   - ✅ 🔴 Write tests for alt text accessibility
   - ✅ 🟢 Implement AltTextTune Block Tune (WCAG AA compliance)
   - ✅ 🔵 Add file validation (10MB max, type checking)
   - ✅ **IMPLEMENTATION:** Store originals, optimize on-demand
   - ✅ **FEATURES:** Visual alt text indicator, auto-remove failed blocks
   - ✅ **PREVIEW:** 1200px max in editor (theme-configurable in future)

**Deliverable:**
- ✅ Can create, edit, and save posts locally
- ✅ Can switch between multiple posts
- ✅ Can delete and restore posts
- ✅ Can upload images with alt text for accessibility
- ✅ Images stored as Blobs with on-demand optimization
- ✅ 90%+ test coverage on core modules (71 tests passing)
- ✅ All tests passing
- ✅ Test suite runs in ~20 seconds

### Phase 2: Styling System with TDD (Week 2-3) ✅ COMPLETED
**Goal: Typography and theme system**

**TDD Tasks:**
1. **CSS Variables Architecture** ✅
   - ✅ Design base variables (minor third scale)
   - ✅ Implement responsive fluid typography with clamp()
   - ✅ Create base content styles

2. **Theme Engine (TDD)** ✅
   - ✅ 🔴 Write tests for theme loading
   - ✅ 🟢 Implement theme CSS injection
   - ✅ 🔴 Write tests for theme switching
   - ✅ 🟢 Implement dynamic theme switching
   - ⏭️ Per-post themes (deferred to post-v1.0)
   - ✅ 🟢 Implement theme persistence
   - ✅ 🔵 Refactor for performance

3. **Default Themes** ✅
   - ✅ Create Minimal theme (clean, high contrast, generous whitespace)
   - ✅ Create Modern theme (warm, contemporary, balanced)
   - ✅ Test theme isolation (app UI vs content)
   - ⏭️ Serif theme (deferred to post-v1.0)

4. **Theme Selector Component (TDD)** ✅
   - ✅ 🔴 Write tests for settings view
   - ✅ 🟢 Implement theme selector UI
   - ✅ 🟢 Implement live theme switching
   - ⏭️ Preview thumbnails (deferred to post-v1.0)

**Deliverable:**
- ✅ Beautiful, responsive content with theme switching
- ✅ Fluid typography that scales smoothly across all devices
- ✅ Two distinct themes (Minimal, Modern)
- ✅ 85%+ test coverage on theme engine (16 tests)
- ✅ All tests passing (124 total)

### Phase 3: Custom Blocks with TDD (Week 3) ✅ COMPLETED (Core Features)
**Goal: Enhanced editing capabilities**

**TDD Tasks:**
1. **Image Handling (TDD)** ✅ COMPLETED IN PHASE 1
   - ✅ Completed early due to priority (see Phase 1, Week 2, item 9)
   - ✅ Full implementation: storage, optimization, accessibility, validation
   - ✅ 29 tests passing (17 storage + 12 optimization)

2. **YouTube Embed Block (TDD)** ⏭️ DEFERRED to post-MVP
   - 🔴 Write tests for URL parsing
   - 🟢 Implement video ID extraction
   - 🔴 Write tests for embed rendering
   - 🟢 Create custom EditorJS block
   - 🔵 Add validation

3. **Spacer Block (TDD)** ⏭️ DEFERRED to post-MVP
   - 🔴 Write tests for spacer sizes
   - 🟢 Implement spacer block
   - 🔴 Write tests for custom size
   - 🟢 Add custom size option
   - 🔵 Refactor for simplicity

4. **Integration Testing**
   - ✅ Image workflow tested (upload → store → display → optimize)
   - ⏭️ Custom blocks deferred to post-MVP

**Deliverable:**
- ✅ Full-featured block editor with image support
- ✅ 85%+ test coverage on image handling
- ✅ Image handling fully tested and implemented
- ⏭️ YouTube/Spacer blocks deferred for faster MVP delivery

### Phase 4: Export System with TDD (Week 4) ✅ COMPLETED
**Goal: Static HTML & Markdown generation**

**TDD Tasks:**
1. **HTML Generator (TDD)** ✅
   - ✅ 🔴 Write tests for paragraph rendering
   - ✅ 🟢 Implement paragraph → HTML
   - ✅ 🔴 Write tests for headings
   - ✅ 🟢 Implement heading → HTML
   - ✅ 🔴 Write tests for all block types (list, quote, code, image)
   - ✅ 🟢 Implement complete renderer
   - ✅ 🔴 Write tests for image references
   - ✅ 🟢 Implement image path handling (WebP conversion)
   - ✅ 🔵 Refactor for maintainability
   - **Files:** src/exporter/html-generator.js (55 tests)

2. **Markdown Generator (TDD)** ✅
   - ✅ 🔴 Write tests for Markdown conversion
   - ✅ 🟢 Implement EditorJS → Markdown with inline HTML conversion
   - ✅ 🔴 Write tests for all block types
   - ✅ 🟢 Complete Markdown renderer (bold, italic, links, code)
   - ✅ 🔵 Handle edge cases (nested formatting, empty blocks)
   - **Files:** src/exporter/markdown-generator.js (44 tests)

3. **Image Optimizer (TDD)** ✅ COMPLETED IN PHASE 1
   - ✅ Canvas-based resize implemented (src/utils/image-optimizer.js)
   - ✅ WebP conversion with quality controls
   - ✅ Aspect ratio preservation with calculateDimensions()
   - ✅ 12 tests passing (validation + dimension calculations)
   - ✅ Manual Canvas testing via test-optimization.html
   - ✅ Integrated into export bundler

4. **ZIP Bundler (TDD)** ✅
   - ✅ 🔴 Write integration tests for ZIP export
   - ✅ 🟢 Implement JSZip bundling
   - ✅ 🔴 Write tests for file structure
   - ✅ 🟢 Generate correct directory structure (index.html, index.md, images/, css/)
   - ✅ 🔴 Write tests for optimized images in ZIP
   - ✅ 🟢 Include optimized images (WebP conversion)
   - ✅ 🔵 Handle EditorJS content structure (blocks array)
   - **Files:** src/exporter/bundler.js (15 tests)

5. **Template System (TDD)** ✅
   - ✅ 🔴 Write tests for HTML template
   - ✅ 🟢 Implement template generation with title in body
   - ✅ 🔴 Write tests for CSS bundling
   - ✅ 🟢 Combine base + theme CSS using Vite ?raw imports
   - **Files:** Integrated into bundler.js

6. **Export Integration** ✅
   - ✅ 🔴 Write end-to-end export tests
   - ✅ 🟢 Complete workflow: Post → ZIP (HTML + Markdown + Images + CSS)
   - ✅ Export button in editor toolbar
   - ✅ Download utility (src/utils/download.js)
   - ✅ Loading state and error handling

**Deliverable:**
- ✅ Can export posts to static HTML and Markdown with optimized images
- ✅ 90%+ test coverage on export system (114 tests for export module)
- ✅ Integration tests verify complete export workflow
- ✅ ZIP files validated with correct structure
- ✅ One-click export button in editor UI
- ✅ 224 total tests passing

### Phase 5: Content Publishing (Week 5) 🚧 IN PROGRESS
**Goal: Enable users to publish their blog content to hosting platforms with one click**

> **Note:** The Write Local *app* stays local (that's the point!). This phase is about publishing *user content* (the blog posts they write) to hosting platforms so their content is accessible online.

**TDD Tasks:**
1. **Netlify Integration (TDD)** ✅ COMPLETE
   - ✅ 🔴 Write tests for Netlify API auth
   - ✅ 🟢 Implement OAuth flow (using MSW to mock)
   - ✅ 🔴 Write tests for site deployment
   - ✅ 🟢 Implement deploy endpoint
   - ✅ 🔵 Add error handling
   - ✅ **CORS workaround:** Netlify API returns duplicate headers; implemented detection and recovery
   - **Files:** `src/publisher/auth-storage.js`, `netlify-oauth.js`, `netlify-api.js`, `deploy-service.js`
   - **Tests:** 24 tests passing (5 + 6 + 8 + 5)

2. **Publish View Component (TDD)** ✅ COMPLETE
   - ✅ 🔴 Write tests for publish UI
   - ✅ 🟢 Implement publish view (not modal - full view in sidebar)
   - ✅ 🔴 Write tests for platform selection
   - ✅ 🟢 Add site selector dropdown
   - ✅ 🔴 Write tests for deployment status
   - ✅ 🟢 Show progress/success/error states
   - ✅ 🔵 Post marked as "published" after success
   - **Files:** `src/components/publish-view.js`
   - **Tests:** 13 tests passing

3. **Vercel Integration (TDD)** ⏳ TODO
   - 🔴 Write tests for Vercel API
   - 🟢 Implement deployment
   - 🔵 Refactor shared code

4. **GitHub Pages Integration (TDD)** ⏳ TODO
   - 🔴 Write tests for GitHub API
   - 🟢 Implement push to gh-pages
   - 🔵 Add branch protection checks

5. **Integration Testing** ✅ COMPLETE
   - ✅ Use MSW to mock API responses
   - ✅ Test complete publish workflow
   - ✅ Verify error scenarios

**Current Deliverable (Netlify only):**
- ✅ One-click publish to Netlify
- ✅ Publish view with site selection and progress feedback
- ✅ 37 new tests (261 total)
- ✅ Error handling tested
- ✅ CORS workaround for Netlify API

**Remaining Work:**
- ⏳ Vercel integration
- ⏳ GitHub Pages integration
- ⏳ **Multi-post blog architecture** (see Future Enhancements below)

### Phase 6: Polish & Performance with TDD (Week 6)
**Goal: Production-ready**

**TDD Tasks:**
1. **Keyboard Shortcuts (TDD)**
   - 🔴 Write tests for keyboard events
   - 🟢 Implement shortcuts (Ctrl+S, Ctrl+N, etc.)
   - 🔵 Add shortcut help overlay

2. **Distraction-Free Mode (TDD)**
   - 🔴 Write tests for fullscreen toggle
   - 🟢 Implement distraction-free mode
   - 🔵 Smooth transitions

3. **Settings Panel (TDD)**
   - 🔴 Write tests for settings storage
   - 🟢 Implement settings in IndexedDB
   - 🔴 Write tests for settings UI
   - 🟢 Build settings panel
   - 🔵 Add validation

4. **Data Export/Import (TDD)**
   - 🔴 Write tests for data export (JSON)
   - 🟢 Implement full database export
   - 🔴 Write tests for data import
   - 🟢 Implement import with validation
   - 🔵 Handle conflicts

5. **Performance Optimization**
   - Run Lighthouse audits
   - Measure bundle sizes
   - Optimize critical path
   - Verify <1s initial load
   - Test typing latency (<16ms)

6. **Final Testing**
   - Review test coverage (target 85%+)
   - Run full test suite
   - Fix any failing tests
   - E2E testing of critical flows

7. **Documentation**
   - README with setup instructions
   - Contributing guide
   - Theme authoring guide
   - API documentation

8. **User Testing**
   - Test with real users
   - Gather feedback
   - Fix critical bugs
   - Polish rough edges

**Deliverable:**
- ✅ Production-ready v1.0
- ✅ 85%+ overall test coverage
- ✅ All performance targets met
- ✅ Comprehensive documentation
- ✅ Battle-tested with users

---

## 8. Technical Decisions Summary

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Framework | Vanilla JS + Vite | Maximum performance, minimal overhead |
| Editor | EditorJS | Block-native, clean JSON, extensible |
| Storage | IndexedDB (Dexie) | Async, large storage, structured data |
| Image Handling | File API + Blobs | 100% browser support, instant preview, offline-first |
| Image Storage | Object URLs + IndexedDB | No encoding overhead, works everywhere |
| Image Export | WebP optimization | 30-70% size reduction, fast page loads |
| Styling | CSS Variables | Native theming, zero runtime cost |
| Type Scale | Minor Third (1.2) | Subtle, text-heavy interfaces |
| Export Format | ZIP (HTML + Markdown) | Optimal performance, portable content |
| Bundling | JSZip (lazy-loaded) | Standard format, keeps main bundle small |
| Hosting | Netlify/Vercel/GitHub Pages | Free, fast, simple deployment |

---

## 9. Key Features Summary

### Core Features
- ✅ Offline-first architecture
- ✅ Block-based editor (EditorJS)
- ✅ Auto-save to IndexedDB
- ✅ CSS-only theming system
- ✅ Per-post theme selection
- ✅ Minor third typography scale
- ✅ Responsive fluid typography
- ✅ Static HTML export
- ✅ One-click publishing

### Editor Blocks
- ✅ Paragraph
- ✅ Headings (H1-H6)
- ✅ Lists (ordered/unordered)
- ✅ Quotes
- ✅ Code
- ✅ Images (with alt text, file validation, optimization)
- ⏭️ YouTube embeds (custom) - deferred to post-MVP
- ⏭️ Spacer (custom) - deferred to post-MVP

### Themes
- ✅ Default minimal theme
- ✅ Serif alternative theme
- ✅ Simple theme authoring (CSS only)
- ✅ Live theme preview

### Publishing & Export
- ✅ Download as ZIP (HTML + Markdown + optimized images) - **IMPLEMENTED**
- ✅ Automatic image optimization (WebP, resize) - **IMPLEMENTED**
- ✅ Markdown export alongside HTML - **IMPLEMENTED**
- ✅ One-click Export button in editor - **IMPLEMENTED**
- ⏳ Optional single-file HTML (with warnings) - deferred
- ⏳ Deploy to Netlify - Phase 5
- ⏳ Deploy to Vercel - Phase 5
- ⏳ Deploy to GitHub Pages - Phase 5

---

## 10. Decisions Made & Future Enhancements

### ✅ Decisions Finalized

1. **Image handling**: ✅ IMPLEMENTED (Phase 1)
   - File API + Blobs in IndexedDB + Object URLs
   - Store ORIGINALS, optimize on-demand (editor + export)
   - Works in 100% of browsers
   - Instant preview, no encoding overhead
   - Full offline support
   - **Files:** src/core/image-storage.js, src/utils/image-optimizer.js
   - **Tests:** 29 passing (17 storage + 12 optimization)

2. **Image optimization**: ✅ IMPLEMENTED (Phase 1)
   - Canvas API with WebP conversion at 85% quality
   - Configurable dimensions (1200px in editor, 2000px for export)
   - Aspect ratio preservation, no upscaling
   - 30-70% size reduction in testing
   - **Ready for:** Export system integration (Phase 4)

3. **Image accessibility**: ✅ IMPLEMENTED (Phase 1)
   - WCAG AA compliant alt text via AltTextTune Block Tune
   - Visual indicator (orange outline) when alt text missing
   - Alt text synced to IndexedDB during auto-save
   - Caption support via EditorJS native functionality

4. **Image validation**: ✅ IMPLEMENTED (Phase 1)
   - File type validation (image/* only)
   - File size limit (10MB max)
   - Detailed error messages with actual file size
   - Auto-remove failed upload blocks
   - **Known issue:** Double notification (non-critical, accepted)

5. **Markdown support**: ✅ Export both HTML and Markdown
   - Markdown generated alongside HTML in ZIP
   - Portable content format
   - Import functionality deferred to post-v1.0

6. **Multi-site support**: ✅ Single site for v1.0, multi-site planned
   - Start simple with one configured site
   - Architecture will support multiple sites in future

### Future Enhancements (Post v1.0)

#### 🎯 Priority: Multi-Post Blog Architecture

**Current Limitation:**
Each publish creates a separate Netlify site with a single post. Users need a "blog" - one site with multiple posts.

**Architecture Needed:**
```
mysite.netlify.app/
├── index.html           # Blog home with post listing
├── my-first-post/
│   └── index.html       # Individual post
├── another-post/
│   └── index.html
├── css/
│   └── theme.css        # Shared theme
├── rss.xml             # RSS feed
└── sitemap.xml         # For SEO
```

**Implementation Considerations:**
1. **Blog entity in IndexedDB** - Link posts to a "blog" configuration
2. **Index page generator** - List all published posts with excerpts
3. **Shared layout** - Navigation, footer across all pages
4. **Incremental publishing** - Only update changed posts
5. **URL structure** - `/{post-slug}/index.html` for clean URLs

#### 🎯 Priority: Per-Post Theme Selection

**Current Limitation:**
All posts use the global default theme. Users want different themes for different posts.

**Architecture Needed:**
```javascript
// Current: Global settings only
settings: { key: 'defaultTheme', value: 'minimal' }

// Needed: Post-specific overrides
posts: {
  id: 'uuid',
  title: 'string',
  theme: 'modern',  // Post-specific theme (already in schema!)
  // ...
}
```

**Implementation:**
1. **Theme selector in editor** - Dropdown to override default theme for current post
2. **Distinguish null vs explicit** - `null` = use default, `'modern'` = use modern
3. **Apply on load** - When loading post, apply its theme (or default)
4. **Export with post theme** - Bundle the post's selected theme, not global default

**Content Management:**
- Search across all posts
- Tags and categories
- Markdown import functionality
- Content versioning/history
- Post templates

**Publishing:**
- Multiple site configurations
- Export to Medium/Dev.to
- RSS feed generation
- Sitemap generation
- Automated deployment scheduling

**Themes & Design:**
- Custom fonts in themes
- Theme marketplace/gallery
- Dark mode for app UI (content themes can already do this)
- Theme preview gallery

**Advanced Features:**
- Collaboration/multi-user editing
- Analytics integration
- SEO metadata editor
- Comment system integration
- Mobile app (PWA with offline sync)

**Performance:**
- Service worker for app caching
- Background sync for auto-publish
- Incremental static regeneration

---

## 11. Success Metrics

### Performance Targets
- ⚡ Typing latency: < 16ms
- ⚡ Initial load: < 1s
- ⚡ Time to interactive: < 1.5s
- ⚡ Main bundle: < 50KB gzipped

### User Experience Targets
- ✍️ Zero friction writing
- 🎨 Beautiful default typography
- 🚀 One-click publish
- 📱 Fully responsive
- ⚙️ Theme creation in < 30 minutes

---

## 12. Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "@editorjs/editorjs": "^2.29.0",
    "@editorjs/header": "^2.8.0",
    "@editorjs/paragraph": "^2.11.0",
    "@editorjs/list": "^1.9.0",
    "@editorjs/quote": "^2.6.0",
    "@editorjs/code": "^2.9.0",
    "@editorjs/image": "^2.9.0",
    "dexie": "^4.0.0",
    "jszip": "^3.10.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@testing-library/dom": "^10.0.0",
    "@testing-library/user-event": "^14.5.0",
    "happy-dom": "^15.0.0",
    "fake-indexeddb": "^6.0.0",
    "msw": "^2.0.0"
  }
}
```

**Bundle Size Estimate:**

*Main bundle (editor):*
- EditorJS + plugins: ~150KB
- Dexie: ~30KB
- App code: ~30KB
- **Main Total:** ~210KB (≈60KB gzipped)

*Lazy-loaded (export):*
- JSZip: ~100KB (~30KB gzipped)
- Export utilities: ~20KB
- **Export Total:** ~120KB (≈35KB gzipped)

**Overall:** ~330KB uncompressed (≈95KB gzipped total, loaded on demand)

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| EditorJS performance with large posts | High | Implement virtualization for long posts |
| IndexedDB browser support | Medium | Fallback to localStorage with warning |
| Theme CSS conflicts | Medium | Strict CSS scoping, namespace all theme vars |
| Export bundle size with images | High | Implement image optimization, offer separate image hosting |
| Publishing API changes | Low | Abstract API layer, graceful degradation |

---

## Sources & Research

This plan was informed by the following research:

**Editor Comparison:**
- [Which rich text editor framework should you choose in 2025? | Liveblocks](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025)
- [Migrate from Editor.js | Tiptap](https://tiptap.dev/docs/guides/migrate-from-editorjs)
- [GitHub - ueberdosis/tiptap](https://github.com/ueberdosis/tiptap)

**Offline Storage:**
- [Offline-first frontend apps in 2025 | LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Store data on the device | Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/offline)
- [GitHub - localForage/localForage](https://github.com/localForage/localForage)

**Typography:**
- [The 2025 Guide to Responsive Typography | Design Shack](https://designshack.net/articles/typography/guide-to-responsive-typography-sizing-and-scales/)
- [Responsive Typography Using Modern CSS](https://stevenloria.com/responsive-typography/)
- [Generating font-size CSS Rules | Modern CSS Solutions](https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/)

**Static Site Generation:**
- [Building a Static Website from JSON Data with Astro](https://dev.solita.fi/2024/12/02/building-static-websites-with-astro.html)
- [Understanding static HTML export in Next.js | LogRocket](https://blog.logrocket.com/understanding-static-html-export-next-js/)

**Hosting:**
- [Vercel vs Netlify in 2025 | Northflank](https://northflank.com/blog/vercel-vs-netlify-choosing-the-deployment-platform-in-2025)
- [6 best free static website hosting services | Appwrite](https://appwrite.io/blog/post/best-free-static-website-hosting)
- [Hosting a Static Website: GitHub Pages, Netlify, Vercel | NamasteDev](https://namastedev.com/blog/hosting-a-static-website-comparing-github-pages-netlify-and-vercel/)

---

## Next Steps

> **📋 For Current Implementation Status**: See **[PROGRESS.md](./PROGRESS.md)** for what's been completed and what's next.

### 🚀 Ready for Content Publishing!

**Phases 1-4 Complete** (224 tests passing):
- ✅ Core Infrastructure (storage, editor, routing)
- ✅ Theme System (responsive typography, 2 themes)
- ✅ Image Handling (storage, optimization, accessibility)
- ✅ Export System (HTML, Markdown, ZIP bundler)

**Phase 5: Publish User Content**

The local writing experience is complete. Users can write, edit, theme, and export their blog posts. Now we need to let them publish their content online with one click.

> **Remember:** The Write Local *app* stays local - that's the whole point! Phase 5 is about publishing the *content* users create to hosting platforms.

**To Build:**
1. Publish modal UI (platform selection, progress, status feedback)
2. Platform integrations via APIs (Netlify, Vercel, GitHub Pages)
3. OAuth authentication flows for each platform
4. Use MSW to mock API responses in tests

**Post-Publishing MVP:**
- Keyboard shortcuts and polish
- Additional themes
- Documentation

---

*This plan represents a comprehensive blueprint for building Write Local. It balances ambitious goals with pragmatic implementation, prioritizing the core writing experience while maintaining flexibility for future enhancements.*

**Last Updated:** 2026-01-16 - Netlify publishing implemented with 261 tests passing. Users can connect to Netlify via OAuth, create new sites, or deploy to existing sites. Theme engine refactored to use bundled CSS. **Remaining Phase 5 work:** Vercel/GitHub Pages integration, multi-post blog architecture, per-post theme selection.
