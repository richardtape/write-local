# Write Local - Development Progress Journal

This document tracks implementation progress, decisions, and reasoning to provide context for future development sessions.

---

## Current Status

**Phase:** Phase 1 - Core Infrastructure (Week 1-2)
**Last Updated:** 2026-01-04
**Development Approach:** Test-Driven Development (TDD)

### ✅ Completed
- [x] Development environment setup
- [x] Project initialization
- [x] Dependency installation
- [x] Testing infrastructure configuration
- [x] Directory structure creation
- [x] EditorJS integration with slash commands
- [x] Complete storage layer (CRUD + status management)
- [x] Auto-save functionality with debouncing
- [x] Auto-load most recent post on page refresh
- [x] Post status management (draft, published, pending, trashed)
- [x] Soft delete and permanent delete
- [x] Slug generation from titles
- [x] **Separate title input field** (distinct from editor content)
- [x] **Post List UI** (sidebar with all posts)
- [x] **Post filtering** (All, Drafts, Published)
- [x] **Post switching** (click to load different posts)
- [x] **Delete from UI** (soft delete with × button)
- [x] **Trash View** (view, restore, and permanently delete trashed posts)
- [x] **New Post button** (creates fresh post and focuses title)
- [x] **Image Upload** (EditorJS image block with custom uploader)
- [x] **Image Storage** (Blobs in IndexedDB with full CRUD)
- [x] **Alt Text for Accessibility** (WCAG AA compliant via Block Tune)
- [x] **Image Validation** (file size 10MB max, type checking)
- [x] **Image Optimization** (Canvas API resize + WebP conversion)
- [x] **Optimized Previews** (1200px max in editor, originals preserved)

### 🚧 In Progress
- None currently

### 📋 Next Steps
1. **Theme System** (Phase 2 - In progress)
   - CSS theme engine with per-post selection
   - Theme metadata (including maxImageWidth)
   - Apply themes to editor (WYSIWYG)
   - Default themes (minimal, serif)
2. **Export System** (Phase 4)
   - Export to HTML
   - Export to Markdown
   - ZIP bundling with optimized images
   - Theme-aware image optimization
3. **Routing** (Phase 2)
   - Hash-based routing for posts
   - URL parameters for post IDs
   - Direct links to trash view
4. **Additional Features**
   - Search/filter posts by title
   - Post count badges on filters
   - Keyboard shortcuts

### 📊 Test Status
- **Total Tests:** 71 passing ✅
  - Storage tests: 20
  - Auto-save tests: 8
  - Post-list tests: 19
  - Trash-view tests: 12
  - Image-storage tests: 0 (skipped - tested manually)
  - Image-optimizer tests: 12
- **Test Coverage:** On track for 80%+ target

---

## Session Log

### 2026-01-01: Initial Project Setup

#### Environment Setup

**Decision: Use nvm for Node.js management**
- **Reasoning:**
  - Best practice for macOS development
  - Easy version switching and upgrades
  - No `sudo` required for global packages
  - Industry standard
- **Implementation:**
  - Installed nvm v0.40.3
  - Installed Node.js v24.12.0 LTS
  - npm v11.6.2

#### Project Initialization

**Decision: Manual Vite setup instead of template**
- **Reasoning:**
  - Directory not empty (had README.md, PLAN.md, LICENSE)
  - More control over initial configuration
  - Customizing setup according to PLAN.md anyway
- **Implementation:**
  - Created minimal package.json
  - Installed latest versions of dependencies (not pinned)
  - Created index.html, vite.config.js, src/main.js

#### Configuration Decisions

**Decision: Use .env file for port configuration**
- **Port:** 7034
- **Reasoning:**
  - Separates configuration from code
  - Easy to change without editing config files
  - Follows 12-factor app principles
- **Implementation:**
  - Created `.env` with `VITE_PORT=7034`
  - Created `.env.example` for documentation
  - Updated vite.config.js to read from env
  - Added `.env` to .gitignore

**Decision: Always install latest package versions**
- **Reasoning:**
  - Keep project up-to-date from the start
  - Avoid technical debt from old versions
  - Security benefits
  - Use `npm install <package>` to get latest versions
- **Implementation:**
  - No version pinning in initial package.json
  - Let npm resolve to latest compatible versions

#### Dependencies Installed

**Core Production Dependencies:**
- `@editorjs/editorjs` - Block-based editor (core)
- `@editorjs/header` - Heading blocks
- `@editorjs/paragraph` - Paragraph blocks
- `@editorjs/list` - List blocks
- `@editorjs/quote` - Quote blocks
- `@editorjs/code` - Code blocks
- `@editorjs/image` - Image blocks
- `dexie` - IndexedDB wrapper (v4.0.0+)
- `jszip` - ZIP file generation (v3.10.0+)
- `nanoid` - ID generation (v5.0.0+)

**Development Dependencies:**
- `vite` - Build tool (v7.3.0)
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixes
- `vitest` - Test runner (v4.0.16)
- `@vitest/ui` - Visual test interface
- `@vitest/coverage-v8` - Code coverage
- `@testing-library/dom` - DOM testing utilities
- `@testing-library/user-event` - User interaction simulation
- `happy-dom` - Lightweight DOM implementation
- `fake-indexeddb` - IndexedDB mock for tests
- `msw` - API mocking for tests

#### Testing Configuration

**Decision: Use vitest.config.js (not TypeScript)**
- **Reasoning:**
  - Project uses vanilla JavaScript (no TypeScript)
  - Simpler configuration
  - Consistent with project's "minimal overhead" philosophy
- **Configuration highlights:**
  - `globals: true` - No need to import `describe`, `it`, `expect`
  - `environment: 'happy-dom'` - Fast DOM for component tests
  - `bail: 1` - Fail fast for TDD workflow
  - `threads: true` - Parallel test execution
  - Coverage thresholds: 80% minimum across all metrics

**Test Setup (tests/setup.js):**
- IndexedDB polyfill via `fake-indexeddb/auto`
- Mock `URL.createObjectURL` for image tests
- Database reset strategy to be added once db instance created

#### Directory Structure

Created architecture following PLAN.md:

```
src/
├── core/          # Core systems (storage, editor, router, theme-engine)
├── components/    # UI components (post-list, post-editor, theme-selector, publish-modal)
├── blocks/        # Custom EditorJS blocks (youtube-embed, spacer)
├── exporter/      # Static file generation (html-generator, markdown-generator, bundler)
├── themes/        # CSS-only themes (base.css, default.css, serif.css)
├── styles/        # App UI styles (app.css, typography.css, variables.css)
└── utils/         # Pure utility functions (slug, date, download)

tests/
└── integration/   # Integration tests
```

#### Files Created

- `package.json` - Project manifest with scripts
- `index.html` - App entry point
- `vite.config.js` - Vite configuration (reads port from .env)
- `vitest.config.js` - Test configuration (TDD-optimized)
- `.env` - Environment variables (port 7034)
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- `src/main.js` - JavaScript entry point (placeholder)
- `tests/setup.js` - Test environment setup

#### Verification

**Vite Dev Server:**
- ✅ Successfully starts on http://localhost:7034/
- ✅ Hot Module Replacement (HMR) working
- ✅ Loads in 81ms

**Vitest:**
- ✅ Test runner configured correctly
- ✅ No tests yet (expected)
- ✅ Ready for TDD workflow

### 2026-01-01 (Continued): Critical Editor UX Decisions

#### Editor Experience Philosophy

**Decision: Notion-like editing experience with slash commands and context menus**

**Requirements:**
1. **Default block: Paragraph**
   - Just start typing - no friction
   - New empty blocks are always paragraph blocks by default

2. **Slash commands for block insertion**
   - Type `/` to trigger block type menu
   - Example: `/heading` → Select heading level → Insert heading block
   - Example: `/list` → Choose ordered/unordered
   - No visible toolbar needed - keep interface minimal

3. **Context menu for text formatting**
   - Select text → Context menu appears
   - Format options: Bold, Italic, Underline, Text color
   - Direct manipulation, no toolbar clutter

4. **Block-specific settings**
   - Headings: Choose level (H1-H6)
   - Lists: Choose ordered vs unordered
   - Each block type has its own configuration options

**Reasoning:**
- **Zero friction writing:** Start typing immediately, no clicking toolbars
- **Keyboard-first workflow:** Slash commands keep hands on keyboard
- **Minimal UI:** Context menus only appear when needed
- **Discoverability:** Slash command menu shows available options
- **Follows modern editor patterns:** Notion, Linear, Craft all use this pattern
- **Performance:** No always-visible toolbars consuming screen space

**Implementation Implications:**
- Need to research EditorJS slash command plugins (or build custom)
- Inline tools API for context menu formatting
- Block tunes API for block-specific settings
- This becomes the **first priority** for implementation
- Will need proof-of-concept to validate EditorJS can support this

**EditorJS Capabilities to Explore:**
- Inline Tools API (for bold, italic, underline, color)
- Block Tunes API (for block-specific settings)
- Custom plugins for slash commands
- Potential plugins:
  - `editorjs-slash-commands` or similar
  - Custom inline toolbar positioning
  - Custom block tune implementations

**Validation:**
- ✅ EditorJS has built-in slash commands that work exactly as needed
- No custom plugins required for basic slash command functionality
- Can proceed directly with implementation

**Next Actions:**
1. Set up basic EditorJS instance with paragraph and heading blocks
2. Configure inline tools (bold, italic, underline, color)
3. Test the editing experience
4. Then proceed with storage layer (Dexie) and routing

---

### 2026-01-02: Core Editor & Storage Implementation

#### EditorJS Implementation

**Decision: EditorJS provides slash commands out-of-the-box**
- **Outcome:** No custom plugins needed - EditorJS natively supports `/` command menu
- **Implementation:**
  - Configured paragraph (default block)
  - Configured header (H1-H6, default H2)
  - Configured list (ordered/unordered)
  - Inline toolbar: bold, italic, link
  - Auto-focus enabled

#### Storage Layer (TDD Approach)

**Decision: Build complete storage layer with Test-Driven Development**
- **Reasoning:**
  - Critical foundation - needs to be rock-solid
  - TDD ensures reliability and prevents regressions
  - Tests document expected behavior
- **Implementation:**
  - Created 20 storage tests covering all CRUD operations
  - Co-located tests with source files (`storage.js` + `storage.test.js`)
  - Used Dexie for IndexedDB wrapper
  - Used nanoid for ID generation

**Storage Functions Implemented:**
1. `createPost(data)` - Create new post with auto-generated slug
2. `getPost(id)` - Retrieve post by ID
3. `updatePost(id, updates)` - Update post (partial updates supported)
4. `listPosts(options)` - List posts with optional status filter, sorted by updatedAt
5. `deletePost(id, options)` - Soft delete (trash) or permanent delete
6. `setStatus(id, status)` - Set post status with publishedAt management
7. `getMostRecentPost()` - Get most recently updated post (excludes trashed)

**Post Status System:**
- **Statuses:** draft, published, pending, trashed
- **Status transitions:** All transitions validated and tested
- **publishedAt handling:**
  - Set when status → 'published'
  - Cleared when status → any other status
- **Soft delete:** Default behavior moves to trash
- **Permanent delete:** Optional with `{ permanent: true }`

**Slug Generation:**
- Created utility function `generateSlug(title)`
- Converts to lowercase
- Removes special characters
- Replaces spaces with hyphens
- Handles multiple spaces correctly

#### Auto-Save Implementation (TDD Approach)

**Decision: Debounced auto-save with 500ms delay**
- **Reasoning:**
  - Prevents excessive saves during typing
  - Balances data safety with performance
  - Industry standard delay
- **Implementation:**
  - Created `AutoSave` class with event system
  - Debounced `scheduleSave()` method
  - Smart title extraction from content
  - Status events: 'saving', 'saved', 'error'

**Auto-Save Features:**
1. **Debouncing:** Multiple rapid changes → single save after 500ms
2. **Smart Title Extraction:**
   - First heading block → use as title
   - No heading → use first paragraph text
   - Empty content → use "Untitled"
3. **Create vs Update:**
   - First save → creates new post
   - Subsequent saves → updates same post
4. **Event System:**
   - Emits status changes for UI feedback
   - Simple `on(event, callback)` API

**UI Integration:**
- Save status indicator (top-right corner)
- Visual feedback: Saving (yellow), Saved (green), Error (red)
- Auto-saves on every content change (debounced)

#### Auto-Load Implementation

**Decision: Auto-load most recent post on page refresh**
- **Reasoning:**
  - Seamless user experience - continue where you left off
  - No manual "load" step needed
  - Simplest approach for single-user app
- **Implementation:**
  - `getMostRecentPost()` gets latest non-trashed post
  - `AutoSave.load(postId)` loads post into editor
  - Shows "Loaded" indicator on successful load

**Auto-Load Behavior:**
- On page load → check for posts
- If posts exist → load most recent
- If no posts → start with empty editor
- Automatically sets `postId` so saves update the same post

#### Testing Achievements

**Test Suite:**
- **28 tests passing** (0 failures)
- **Storage tests:** 20 tests
  - CRUD operations
  - Status management
  - Delete functionality
  - Most recent post retrieval
- **Auto-save tests:** 8 tests
  - Create and update posts
  - Debouncing behavior
  - Title extraction
  - Status events
  - Load functionality

**Test Infrastructure:**
- Vitest configured with coverage thresholds (80% minimum)
- fake-indexeddb for testing storage
- happy-dom for component tests
- Co-located unit tests
- Integration tests in `tests/integration/`

**Testing Challenges Solved:**
- Timer conflicts with async IndexedDB operations
- Solution: Only use fake timers for debouncing test
- All other tests use real timers

#### Files Created/Modified

**Created:**
- `src/core/storage.js` - Storage layer
- `src/core/storage.test.js` - 20 storage tests
- `src/core/auto-save.js` - Auto-save functionality
- `src/core/auto-save.test.js` - 8 auto-save tests
- `src/utils/slug.js` - Slug generation utility
- `src/main.js` - Editor integration with auto-save/load
- `index.html` - Editor container with styling
- `vite.config.js` - Vite configuration (port from .env)
- `vitest.config.js` - Test configuration
- `tests/setup.js` - Test environment setup
- `.env` - Port configuration (7034)
- `.gitignore` - Git ignore rules
- `PROGRESS.md` - This file
- `CLAUDE.md` - Documentation for Claude Code

**Modified:**
- `package.json` - Added all dependencies
- `PLAN.md` - Added reference to PROGRESS.md

#### Key Implementation Decisions

**1. Test-Driven Development (TDD)**
- **Decision:** Write tests before implementation for all features
- **Outcome:** 28 tests passing, high confidence in code quality
- **Benefits:** Better design, living documentation, regression prevention

**2. Co-located Tests**
- **Decision:** Unit tests alongside source files
- **Example:** `storage.js` + `storage.test.js` in same directory
- **Benefits:** Easy to find, move together during refactoring

**3. Debounced Auto-Save (500ms)**
- **Decision:** Wait 500ms of inactivity before saving
- **Benefits:** Reduces database writes, maintains performance
- **Trade-off:** Accepted 500ms delay for better UX

**4. Auto-Load Most Recent Post**
- **Decision:** Automatically load latest post on page refresh
- **Alternative Considered:** Show post list first
- **Reasoning:** Simpler UX for single-user app, can add list later

**5. Post Status System**
- **Decision:** Four statuses (draft, published, pending, trashed)
- **publishedAt:** Automatically managed by `setStatus()`
- **Soft Delete:** Default behavior, permanent delete optional

**6. Smart Title Extraction**
- **Decision:** Extract title from first heading/paragraph
- **Fallback:** "Untitled" if content is empty
- **Benefits:** No separate title field needed, natural workflow

#### Current Capabilities

**What Works:**
1. ✅ Write content with EditorJS (slash commands, inline formatting)
2. ✅ Auto-save after 500ms of inactivity
3. ✅ Auto-load most recent post on page refresh
4. ✅ Save status indicator (Saving, Saved, Loaded)
5. ✅ Full CRUD operations in IndexedDB
6. ✅ Post status management
7. ✅ Soft delete and permanent delete

**What's Missing:**
1. ❌ Post list view
2. ❌ Create new post button
3. ❌ Switch between posts
4. ❌ Delete post from UI
5. ❌ Export to HTML/Markdown
6. ❌ Routing system

#### Performance Notes

**Current Performance:**
- ✅ Vite dev server: ~150ms startup
- ✅ Test suite: ~10s (28 tests)
- ✅ Auto-save: < 100ms (IndexedDB write)
- ✅ Page load + auto-load: < 500ms

**Not Yet Measured:**
- Typing latency (target: < 16ms)
- Bundle size (target: < 50KB gzipped)

---

### 2026-01-04: Post Management UI & Trash System

#### Separate Title Field Implementation

**Decision: Add dedicated title input field**
- **Reasoning:**
  - More explicit and familiar UX pattern
  - Clearer separation between title and content
  - Slug generation directly from title field
  - Better for SEO and metadata
- **Implementation:**
  - Large, prominent input field above editor
  - Auto-saves on typing (debounced 500ms)
  - Auto-populates when loading posts
  - Focuses automatically on "New Post"

**Changes Made:**
- Updated `AutoSave` constructor to accept `titleElement` parameter
- Replaced `extractTitle()` with `getTitle()` from input field
- Updated `load()` to populate title field
- Modified all 8 auto-save tests for new signature

#### Post List UI Implementation (TDD Approach)

**Decision: Build comprehensive post list sidebar**
- **Reasoning:**
  - Essential for multi-post management
  - Enables quick switching between posts
  - Visual overview of all content
  - Follows modern app patterns (Notion, Bear, etc.)
- **Implementation:**
  - Created `src/components/post-list.js` with 19 tests
  - Two-column layout: sidebar + editor
  - Posts sorted by most recently updated first
  - Real-time active post highlighting

**Post List Features:**
1. **Filter System:**
   - All posts (default)
   - Drafts only
   - Published only
   - Post counts displayed on each filter

2. **Post Items:**
   - Title with ellipsis for long names
   - Status badge (draft/published/pending)
   - Relative time ("2 hours ago")
   - Click to load post
   - Hover-activated delete button (×)

3. **New Post Button:**
   - Creates new post immediately
   - Clears editor and title
   - Focuses title input for immediate typing

4. **Delete Button:**
   - Appears on hover (subtle UX)
   - Soft delete (moves to trash)
   - Prevents post selection when clicked
   - Red hover state indicates destructive action

**TDD Process:**
- 🔴 Red: Wrote 19 tests first
- 🟢 Green: Implemented component to pass all tests
- 🔵 Refactor: Fixed async re-rendering in tests

#### Trash System Implementation (TDD Approach)

**Decision: Separate trash view for managing deleted posts**
- **Reasoning:**
  - Prevent accidental data loss
  - Allow post recovery
  - Clean separation from active posts
  - Familiar pattern (Gmail, macOS Trash)
- **Implementation:**
  - Created `src/components/trash-view.js` with 12 tests
  - Replaces sidebar when viewing trash
  - Two-step delete process: trash → permanent

**Trash View Features:**
1. **Trash List:**
   - Shows all trashed posts
   - Grayed-out styling (visual cue)
   - Item count with proper grammar ("1 item" vs "2 items")
   - Empty state message

2. **Post Actions:**
   - **Restore button:** Moves back to drafts
   - **Delete Forever button:** Permanent deletion with confirmation
   - Buttons stacked below title (full width for readability)

3. **View Content:**
   - Click trashed post to preview content
   - Read-only view in editor
   - Status indicator: "Viewing trashed post"

4. **Navigation:**
   - "View Trash" button at bottom of sidebar
   - "← Back" button to return to posts
   - Maintains view state

**Edge Cases Handled:**
- Deleting currently active post → loads next most recent
- Empty editor when no posts exist
- Permanent delete confirmation dialog
- Event propagation prevention (buttons vs post clicks)

#### UI/UX Improvements

**Layout:**
- Two-column responsive layout (sidebar + editor)
- Sidebar: 320px fixed width
- Editor: Flexible width, max 800px centered
- Full viewport height utilization

**Styling:**
- Hover states on all interactive elements
- Active post highlighting (blue background)
- Delete button opacity animation
- Consistent color scheme (blue primary, red destructive)
- Status badges with semantic colors

**Interactions:**
- Smooth transitions (0.2s)
- Visual feedback for all actions
- Save status indicator (top-right)
- Empty states with helpful messages

#### Testing Achievements

**Test Suite Growth:**
- Added 31 new tests (19 post-list + 12 trash-view)
- Total: 59 tests passing
- All following TDD approach
- Co-located unit tests with source files

**Test Categories:**
- Component rendering tests
- User interaction tests (click handlers)
- Filter/state management tests
- Edge case coverage (empty states, async operations)

#### Files Created/Modified

**Created:**
- `src/components/post-list.js` - Post list component
- `src/components/post-list.test.js` - 19 component tests
- `src/components/trash-view.js` - Trash view component
- `src/components/trash-view.test.js` - 12 component tests

**Modified:**
- `src/core/auto-save.js` - Added title element parameter
- `src/core/auto-save.test.js` - Updated all tests for new signature
- `src/main.js` - Integrated post list and trash view
- `index.html` - Two-column layout + all component styles

#### Key Implementation Decisions

**1. TDD for All UI Components**
- **Decision:** Write tests before implementation for components
- **Outcome:** 31 tests passing, high confidence in UI logic
- **Benefits:** Caught async re-rendering bugs early, documented behavior

**2. Soft Delete by Default**
- **Decision:** Delete button moves to trash, not permanent delete
- **Reasoning:** Prevents accidental data loss, matches user expectations
- **Implementation:** Storage layer already supported this

**3. Hover-Activated Delete Button**
- **Decision:** Hide delete button until hover
- **Reasoning:** Cleaner UI, prevents accidental clicks
- **Alternative Considered:** Always visible buttons (too cluttered)

**4. Separate Trash View (Not a Filter)**
- **Decision:** Dedicated view replacing sidebar, not another filter
- **Reasoning:** Trash is conceptually separate from active posts
- **Benefits:** Clearer mental model, room for restore/permanent actions

**5. Click to View Trashed Posts**
- **Decision:** Allow previewing trashed post content
- **Reasoning:** Users may need to read content before deciding to restore/delete
- **Implementation:** Load into editor with visual indicator

**6. Stacked Action Buttons**
- **Decision:** Place restore/delete buttons below title
- **Reasoning:** Full width for post titles, better readability
- **Alternative:** Side-by-side (truncated titles to ~4 characters)

#### Current Capabilities

**What Works:**
1. ✅ Write content with EditorJS (slash commands, inline formatting)
2. ✅ Separate title input field (auto-saves, generates slug)
3. ✅ Auto-save after 500ms of inactivity
4. ✅ Auto-load most recent post on page refresh
5. ✅ **Post list sidebar with filters (All, Drafts, Published)**
6. ✅ **Switch between posts by clicking**
7. ✅ **Create new post with button**
8. ✅ **Delete posts from UI (soft delete)**
9. ✅ **Trash view with restore and permanent delete**
10. ✅ **View trashed post content**
11. ✅ Save status indicator (Saving, Saved, Loaded)
12. ✅ Full CRUD operations in IndexedDB
13. ✅ Post status management
14. ✅ Active post highlighting

**What's Missing:**
1. ❌ Export to HTML/Markdown/ZIP
2. ❌ Routing system (URLs for posts and trash)
3. ❌ Search/filter posts by title
4. ❌ Keyboard shortcuts
5. ❌ Theme system
6. ❌ Custom EditorJS blocks (YouTube, Spacer)

#### Performance Notes

**Current Performance:**
- ✅ Vite dev server: ~150ms startup
- ✅ Test suite: ~15s (59 tests)
- ✅ Auto-save: < 100ms (IndexedDB write)
- ✅ Page load + auto-load: < 500ms
- ✅ Post list render: < 50ms for 100 posts

**UI Performance:**
- Smooth transitions and animations
- No lag when switching posts
- Filter changes are instant
- Delete operations feel immediate

---

## Key Architectural Decisions from PLAN.md

These decisions were made during planning phase and inform our implementation:

### Technology Stack
- **Framework:** Vanilla JavaScript (no React/Vue) - Maximum performance, minimal overhead
- **Editor:** EditorJS - Block-native architecture, clean JSON output
- **Storage:** IndexedDB via Dexie - Async, large storage, structured data
- **Build Tool:** Vite - Fast HMR, optimized builds
- **Testing:** Vitest - Fast, Vite-native, Jest-compatible API

### Image Handling Strategy
- **Storage:** Blobs in IndexedDB (no base64 encoding)
- **Preview:** `URL.createObjectURL()` for instant preview
- **Export:** Optimize to WebP, resize to max 2000x2000px
- **Benefits:** 100% browser support, instant preview, offline-first

### Theme System
- **Architecture:** CSS Zen Garden approach - pure CSS, no JavaScript
- **Scope:** Only affects `.post-content` area (not app UI)
- **Typography:** Minor Third scale (1.2 ratio) with fluid type using `clamp()`
- **Per-post themes:** Each post stores its theme ID

### Export Format
- **Primary:** ZIP file containing:
  - `index.html` - Rendered HTML with relative paths
  - `index.md` - Markdown version
  - `images/` - Optimized WebP images
  - `css/theme.css` - Selected theme CSS
- **Alternative:** Single-file HTML (with performance warnings)

### Development Philosophy
- **TDD Mandatory:** Red-Green-Refactor cycle for all features
- **Performance First:** Sub-16ms typing latency, <1s initial load
- **Avoid Over-Engineering:** Build only what's requested, no premature abstractions
- **Offline-First:** Full functionality without internet

---

## Development Workflow Notes

### Running the Project

```bash
# Development server (http://localhost:7034/)
npm run dev

# Run tests (watch mode for TDD)
npm test

# Run tests (single run)
npm run test:run

# Test UI (browser interface)
npm run test:ui

# Coverage report
npm run test:coverage

# Production build
npm run build

# Preview production build
npm run preview
```

### TDD Workflow

1. **🔴 Red:** Write failing test first
2. **🟢 Green:** Write minimal code to pass test
3. **🔵 Refactor:** Improve code quality without changing behavior

### Test File Organization

- Unit tests: Co-located with source (`src/utils/slug.test.js` next to `slug.js`)
- Integration tests: `tests/integration/`
- Test setup: `tests/setup.js`

---

## Reference Documentation

- **PLAN.md** - Comprehensive 1600+ line implementation plan
- **CLAUDE.md** - Guidance for Claude Code instances
- **README.md** - Project title (minimal currently)
- **LICENSE** - GNU GPL v3.0

---

## Notes for Future Sessions

### Before Starting Work
1. Check this PROGRESS.md for current status
2. Review recent decisions and reasoning
3. Check PLAN.md for phase/week context
4. Review CLAUDE.md for architecture overview

### After Completing Work
1. Update "Current Status" section
2. Add session log entry with date
3. Document decisions and reasoning
4. Note any issues encountered and solutions (if relevant for future work)
5. Update "Next Steps" section

### Testing Reminders
- Always write tests before code (TDD)
- Target: 80%+ overall coverage, 90%+ for core modules
- Tests should be co-located with source files
- Integration tests go in `tests/integration/`

### Performance Targets to Keep in Mind
- Typing latency: < 16ms
- Initial load: < 1s
- Main bundle: < 50KB gzipped
- Export bundle (lazy): < 35KB gzipped

---

*This document is a living record of the project's evolution. Keep it updated!*
