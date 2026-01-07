# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Write Local** is an offline-first, browser-based blog writing application. The project uses Test-Driven Development (TDD) with a comprehensive 6-week implementation roadmap detailed in PLAN.md.

**⚠️ IMPORTANT**: Check **PROGRESS.md** for current implementation status, recent decisions, and session history before starting work.

**Core Technology Stack:**
- **Frontend**: Vanilla JavaScript (no framework) + Vite
- **Editor**: EditorJS (block-based editor)
- **Storage**: IndexedDB via Dexie.js
- **Testing**: Vitest + @testing-library/dom + happy-dom
- **Styling**: CSS Custom Properties (no CSS-in-JS)
- **Export**: JSZip for bundling HTML/Markdown/images

## Development Commands

```bash
# Install dependencies (first time setup)
npm install

# Development server
npm run dev

# Testing (TDD workflow)
npm run test              # Watch mode for TDD
npm run test:ui           # Visual test UI
npm run test:run          # Single run (CI)
npm run test:coverage     # Coverage report

# Build
npm run build             # Production build
npm run preview           # Preview production build
```

## Architecture Overview

### TDD Workflow (Red-Green-Refactor)
All features must be developed using Test-Driven Development:
1. **🔴 Red**: Write failing test first
2. **🟢 Green**: Write minimal code to pass test
3. **🔵 Refactor**: Improve code quality

Tests are co-located with source files (`*.test.js` alongside `*.js`).

### Application Structure
```
src/
├── core/                    # Core systems
│   ├── storage.js          # Dexie IndexedDB setup
│   ├── editor.js           # EditorJS initialization
│   ├── router.js           # Hash-based routing
│   └── theme-engine.js     # CSS theme loading
├── components/             # UI components
│   ├── post-list.js        # Posts listing view
│   ├── post-editor.js      # Main editor view
│   ├── theme-selector.js   # Theme picker
│   └── publish-modal.js    # Export/publish UI
├── blocks/                 # Custom EditorJS blocks
│   ├── youtube-embed.js    # YouTube embed block
│   └── spacer.js           # Spacing block
├── exporter/               # Static file generation
│   ├── html-generator.js   # EditorJS → HTML
│   ├── markdown-generator.js # EditorJS → Markdown
│   ├── image-optimizer.js  # Image resize/WebP conversion
│   ├── bundler.js          # ZIP packaging
│   └── template.js         # HTML template
├── themes/                 # CSS-only themes
│   ├── base.css           # Base variables
│   ├── default.css        # Default theme
│   └── serif.css          # Serif alternative
└── utils/                 # Pure utility functions
    ├── slug.js            # URL slug generation
    ├── date.js            # Date formatting
    └── download.js        # File download helpers
```

### IndexedDB Schema (via Dexie)

```javascript
{
  posts: {
    id: 'uuid',              // Primary key
    title: 'string',
    slug: 'string',          // Auto-generated from title
    content: [],             // EditorJS JSON blocks
    theme: 'string',         // Theme ID
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
    publishedAt: 'timestamp | null',
    status: 'draft | published'
  },
  images: {
    id: 'uuid',              // Primary key
    postId: 'uuid',          // Foreign key → posts
    file: Blob,              // Original image as Blob
    filename: 'string',
    type: 'string',          // MIME type
    size: 'number',
    width: 'number',
    height: 'number',
    caption: 'string',
    alt: 'string',
    createdAt: 'timestamp'
  },
  themes: {
    id: 'string',            // Primary key
    name: 'string',
    css: 'string',           // Full CSS content
    isDefault: 'boolean'
  },
  settings: {
    key: 'string',           // Primary key
    value: 'any'
  }
}
```

**Indexes:**
- `posts`: `updatedAt`, `status`, `[status+updatedAt]` (compound)
- `images`: `postId`

### Storage API (src/core/storage.js)

**Implemented Functions:**
```javascript
// Create
await createPost({ title, content, theme })  // Auto-generates slug, sets status='draft'

// Read
await getPost(id)                            // Get single post by ID
await listPosts({ status })                  // List posts, optional status filter, sorted by updatedAt desc
await getMostRecentPost()                    // Get most recent non-trashed post

// Update
await updatePost(id, { title, content... }) // Update post (partial updates supported)
await setStatus(id, status)                  // Set status with publishedAt management

// Delete
await deletePost(id)                         // Soft delete (moves to trash)
await deletePost(id, { permanent: true })   // Permanent delete
```

**Post Status Management:**
- `setStatus(id, 'published')` → Sets `publishedAt` timestamp
- `setStatus(id, 'draft')` → Clears `publishedAt` to null
- Valid statuses: 'draft', 'published', 'pending', 'trashed'
- `listPosts()` excludes trashed posts by default
- `listPosts({ status: 'trashed' })` to see trash

**Auto-Save API (src/core/auto-save.js):**
```javascript
const autoSave = new AutoSave(editor)
autoSave.scheduleSave()              // Debounced save (500ms)
await autoSave.save()                // Immediate save
await autoSave.load(postId)          // Load post into editor
autoSave.on('statusChange', callback) // Listen for status events
autoSave.destroy()                   // Cleanup timers
```

### Image Handling Strategy

**In Editor:**
- Store images as Blobs in IndexedDB (no base64 encoding)
- Use `URL.createObjectURL()` for instant preview
- Reference images by ID in EditorJS blocks

**On Export:**
- Optimize images (resize + WebP conversion at 85% quality)
- Max dimensions: 2000x2000px
- Bundle in ZIP: `images/` directory with HTML/Markdown/CSS

### Theme System

**Architecture**: CSS Zen Garden approach - themes are pure CSS files that override CSS Custom Properties.

**Base Variables** (in `themes/base.css`):
- Typography scale: Minor Third (1.2 ratio)
- Fluid typography using `clamp()`
- Spacing based on type scale
- Content max-width: 65ch

**Theme Application**:
- Themes only affect `.post-content` area (not app UI)
- Loaded dynamically via `<link>` injection
- Per-post theme selection stored in post record

**Creating Themes**:
Theme authors only need to override CSS variables - no JavaScript required.

## Testing Guidelines

### Test Coverage Requirements

| Area | Minimum | Target |
|------|---------|--------|
| Core (storage, router) | 90% | 100% |
| Exporter | 85% | 95% |
| Utils | 90% | 100% |
| Blocks | 80% | 90% |
| Components | 70% | 85% |
| **Overall** | **80%** | **90%** |

### Test Categories

**Unit Tests (80%)**: Pure functions, individual modules
- Co-located with source: `src/utils/slug.test.js` alongside `slug.js`
- Fast, focused, deterministic

**Integration Tests (15%)**: Multiple modules working together
- Location: `tests/integration/`
- Test workflows: post creation → save → retrieve → export

**Component Tests (5%)**: UI components with user interactions
- Use @testing-library/dom for DOM assertions
- Use @testing-library/user-event for interactions

### Test Setup

Global test setup in `tests/setup.ts` provides:
- IndexedDB polyfill (fake-indexeddb)
- `URL.createObjectURL` mock
- Database reset between tests

### Writing Tests

**Example TDD workflow**:
```javascript
// 🔴 Red - Write failing test
describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });
});

// 🟢 Green - Minimal implementation
export function generateSlug(title) {
  return title.toLowerCase().replace(/\s+/g, '-');
}

// 🔵 Refactor - Handle edge cases
it('removes special characters', () => {
  expect(generateSlug('Hello, World!')).toBe('hello-world');
});
```

## Performance Targets

**Critical Metrics:**
- Typing latency: < 16ms (sub-frame)
- Initial load: < 1s
- Time to Interactive: < 1.5s
- Main bundle: < 50KB gzipped
- Export bundle (lazy-loaded): < 35KB gzipped

**Optimization Strategies:**
- Direct DOM manipulation (no virtual DOM overhead)
- Debounced auto-save (500ms)
- Async IndexedDB operations (non-blocking)
- Code splitting for export/publish features
- Lazy-load JSZip only when exporting

## Implementation Status

**Current Phase**: Phase 1 - Core Infrastructure (Week 1)

**✅ Completed**:
- Vite project initialized
- All dependencies installed
- Vitest configured for TDD (28 tests passing)
- Directory structure created
- Development server running on port 7034
- **EditorJS integrated** - Slash commands, inline formatting (bold, italic, link)
- **Storage layer complete** - Full CRUD with Dexie/IndexedDB
- **Auto-save working** - Debounced 500ms with visual feedback
- **Auto-load working** - Most recent post loads on page refresh
- **Post status system** - draft, published, pending, trashed
- **Delete system** - Soft delete (trash) and permanent delete
- **Slug generation** - Auto-generated from post titles

**🚧 Next Up**:
- Post list view UI
- "New Post" button
- Switch between posts
- Export to HTML/Markdown

**📋 See PROGRESS.md for**:
- Detailed session history (2 sessions documented)
- All decisions and reasoning
- Testing achievements (28 passing tests)
- Current capabilities and what's missing
- Next steps

**Refer to PLAN.md sections**:
- **Section 7**: 6-week implementation roadmap with TDD approach
- **Section 3.4**: Image handling and export system details
- **Section 3.2**: Theme system architecture
- **Section 5**: Custom EditorJS blocks specifications

## Key Design Principles

1. **Performance First**: Zero latency writing experience
2. **Offline-First**: Full functionality without internet
3. **No Framework Overhead**: Vanilla JS for maximum control
4. **Test-Driven**: All features require tests before implementation
5. **Simple Theming**: CSS-only, no JavaScript for themes
6. **Avoid Over-Engineering**:
   - Only build what's requested
   - No premature abstractions
   - Don't add features beyond requirements
   - Three similar lines > premature abstraction

## Export System

**ZIP Structure** (default export format):
```
post-slug.zip
├── index.html          # Rendered HTML with relative paths
├── index.md            # Markdown version
├── images/
│   ├── image-1.webp    # Optimized images
│   └── image-2.webp
└── css/
    └── theme.css       # Selected theme CSS
```

**EditorJS Block Rendering**:
- HTML: Custom renderer in `src/exporter/html-generator.js`
- Markdown: Custom renderer in `src/exporter/markdown-generator.js`
- Image blocks reference files in `images/` directory

## Important Notes

- **No package.json yet**: Project needs initialization before development
- **TDD is mandatory**: Write tests before code (Red-Green-Refactor)
- **IndexedDB required**: Primary storage mechanism, localStorage fallback possible
- **Image handling uses Blobs**: No base64 encoding (instant preview, offline-first)
- **Themes are CSS-only**: No JavaScript in theme files
- **EditorJS is central**: Block-based architecture, clean JSON output
- **Single-file HTML exports**: Optional, with performance warnings (use ZIP by default)

## Reference Documentation

- **PROGRESS.md**: Development progress journal (CHECK THIS FIRST!)
  - Current implementation status
  - Session history with decisions and reasoning
  - Issues encountered and solutions
  - Next steps for development

- **PLAN.md**: Comprehensive implementation plan (1627 lines)
  - Technology decisions and rationale
  - Complete architecture design
  - Database schemas
  - Testing strategy
  - 6-week phased implementation roadmap

- **LICENSE**: GNU General Public License v3
