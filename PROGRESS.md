# Write Local - Development Progress Journal

This document tracks implementation progress, decisions, and reasoning to provide context for future development sessions.

---

## Current Status

**Phase:** Phase 5 (Content Publishing) 🚧 IN PROGRESS
**Last Updated:** 2026-01-16
**Development Approach:** Test-Driven Development (TDD)

### 🚧 Phase 5 Progress (Netlify Publishing)
- [x] MSW test infrastructure for mocking Netlify API
- [x] Auth storage (token storage in IndexedDB)
- [x] Netlify OAuth flow (popup-based authentication)
- [x] Netlify API client (sites, deploys, status polling)
- [x] Deploy service (orchestrates publish workflow)
- [x] Publish view component (UI for connecting and publishing)
- [x] CORS workaround for Netlify API (duplicate headers issue)
- [x] Theme engine refactor (bundled CSS via `?raw` imports)
- [x] Alt text fix (from block tunes to published HTML)
- [x] Post status update after publishing

### 📋 Remaining for Phase 5
- [ ] Vercel integration
- [ ] GitHub Pages integration
- [ ] Multi-post blog architecture (one site with multiple posts)

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
- [x] **Routing System** (History API with clean URLs)
- [x] **Bookmarkable URLs** (posts, filters, trash view, settings)
- [x] **Browser back/forward** (full navigation support)
- [x] **Theme System Scaffolding** (CSS architecture + engine)
- [x] **Settings Page** (theme selection UI)
- [x] **Live Theme Switching** (instant preview without refresh)
- [x] **Responsive Typography** (fluid `clamp()` scaling for all font sizes)
- [x] **Responsive Spacing** (fluid spacing that scales with viewport)
- [x] **Full Theme CSS** (Minimal and Modern themes fully built out)
- [x] **HTML Generator** (EditorJS blocks → HTML with all block types)
- [x] **Markdown Generator** (EditorJS blocks → Markdown with inline formatting)
- [x] **ZIP Bundler** (HTML + Markdown + optimized images + theme CSS)
- [x] **Export Button** (one-click export to ZIP)
- [x] **Download Utility** (triggers browser file download)

### 🚧 Next Priority: CONTENT PUBLISHING (Phase 5)
The local writing experience is complete. Now users need to publish their blog content online!

> **Note:** The Write Local *app* stays local (that's the point!). Phase 5 is about publishing *user content* to hosting platforms like Netlify, Vercel, or GitHub Pages.

### 📋 Next Steps
1. **Content Publishing** (Phase 5 - **CURRENT PRIORITY FOR MVP**)
   - ⏳ Publish modal UI (platform selection, progress, success/error states)
   - ⏳ Netlify publishing (one-click publish user content via API)
   - ⏳ Vercel publishing (alternative platform)
   - ⏳ GitHub Pages publishing (free option)
   - ⏳ OAuth authentication flows for each platform
2. **Deferred Features** (Post-v1.0)
   - Per-post theme override selector
   - Additional themes (serif, dark)
   - Search/filter posts by title
   - Keyboard shortcuts
   - Distraction-free mode
   - YouTube embed block
   - Spacer block

### 📊 Test Status
- **Total Tests:** 261 passing ✅
  - Storage tests: 20
  - Auto-save tests: 8
  - Post-list tests: 19
  - Trash-view tests: 12
  - Router tests: 23
  - Theme engine tests: 16
  - Settings view tests: 6
  - Image-optimizer tests: 12
  - HTML generator tests: 23
  - Markdown generator tests: 45
  - Bundler tests: 12
  - Download utility tests: 4
  - Updated component tests: 24
  - **NEW:** Auth storage tests: 5
  - **NEW:** Netlify OAuth tests: 6
  - **NEW:** Netlify API tests: 8
  - **NEW:** Deploy service tests: 5
  - **NEW:** Publish view tests: 13
- **Test Coverage:** On track for 85%+ target

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

### 2026-01-06: Routing System Implementation

#### Routing Strategy Decision

**Decision: History API (pushState) routing instead of hash-based routing**
- **Reasoning:**
  - Write Local runs locally with Vite dev server (not deployed as static site)
  - Clean URLs without hash fragments
  - Better UX and more professional
  - Vite handles SPA fallback automatically
  - Published blog exports are separate concern (static HTML files)
  - Supports bookmarkable URLs and browser history
- **Implementation:**
  - Created lightweight History API router in vanilla JavaScript
  - No external routing library needed
  - Follows project's "minimal overhead" philosophy

#### Router Implementation (TDD Approach)

**Decision: Build custom router following TDD**
- **Reasoning:**
  - Keeps bundle size minimal (no external dependencies)
  - Full control over functionality
  - Learning opportunity
  - Exactly what we need, nothing more
- **Implementation:**
  - Created `src/core/router.js` with 23 tests
  - Pattern matching for dynamic routes (e.g., `/posts/:id`)
  - Browser back/forward support via `popstate` events
  - Not found handler for invalid routes
  - Route priority system (static routes before dynamic)

**Router Features:**
1. **Dynamic Routes:** `/posts/:id` extracts ID parameter
2. **Navigation:** Programmatic navigation with `router.navigate()`
3. **History Support:** Full browser back/forward button support
4. **Replace Mode:** Option to replace history state instead of pushing
5. **Not Found Handling:** Redirect to default route when no match

**URL Structure:**
```
/                          # Root → redirects to /posts
/posts                     # All posts (default)
/posts/drafts              # Drafts filter
/posts/published           # Published filter
/posts/{post-id}           # Specific post
/trash                     # Trash view
```

#### Integration Changes

**Component Refactoring:**
- **Before:** Callback-based navigation (onNewPost, onPostSelect, onViewTrash, etc.)
- **After:** Router-based navigation with `router.navigate()`
- **Benefits:**
  - URLs reflect app state
  - Bookmarkable views
  - Shareable links to specific posts
  - Browser back/forward works naturally

**Updated Components:**
1. **`post-list.js`:**
   - Accepts `router` and `filter` props instead of callbacks
   - Filter buttons navigate to `/posts`, `/posts/drafts`, `/posts/published`
   - Post items navigate to `/posts/{id}`
   - "New Post" creates post and navigates to `/posts`
   - "View Trash" navigates to `/trash`
   - Delete button handled internally, refreshes via `router.handleRoute()`

2. **`trash-view.js`:**
   - Accepts `router` prop
   - "Back" button navigates to `/posts`

3. **`main.js`:**
   - Removed all callback handlers
   - Set up route definitions with async handlers
   - Each route renders appropriate view
   - Auto-loads most recent post on `/posts` route

#### Testing Challenges & Solutions

**Challenge 1: Router initialization timing**
- **Problem:** Router called `handleRoute()` in constructor before routes were registered
- **Solution:** Removed auto-initialization, call `router.handleRoute()` after routes setup
- **Impact:** Ensures routes are registered before any routing occurs

**Challenge 2: Test environment doesn't auto-trigger route handlers**
- **Problem:** Mock router doesn't execute route handlers like real router
- **Solution:** Tests manually re-render components with new filter/params
- **Example:**
  ```javascript
  // Click filter button
  draftsButton.click();
  // Verify navigation was attempted
  expect(mockRouter.navigate).toHaveBeenCalledWith('/posts/drafts');
  // Simulate what router would do
  await renderPostList(container, { router: mockRouter, filter: 'draft' });
  ```

**Challenge 3: URL path vs filter value mismatch**
- **Problem:** Filter values (`draft`, `published`) didn't match URL paths (`/posts/drafts`)
- **Solution:** Explicit mapping in filter button click handlers
- **Impact:** Consistent URLs while maintaining simple filter values

#### Files Created/Modified

**Created:**
- `src/core/router.js` - Lightweight History API router (148 lines)
- `src/core/router.test.js` - 23 comprehensive tests

**Modified:**
- `src/main.js` - Route definitions and integration
- `src/components/post-list.js` - Router-based navigation
- `src/components/trash-view.js` - Router-based navigation
- `src/components/post-list.test.js` - Updated all tests for router
- `src/components/trash-view.test.js` - Updated close button test

#### Key Implementation Decisions

**1. History API Over Hash Routing**
- **Decision:** Use `pushState`/`popstate` instead of `#/posts`
- **Reasoning:** Cleaner URLs, better UX, Vite dev server supports it
- **Trade-off:** Requires server configuration (but Vite handles it for us)

**2. Custom Router Over Library**
- **Decision:** Build our own router instead of using vue-router, react-router, etc.
- **Reasoning:** No framework, minimal bundle size, exactly what we need
- **Benefits:** ~150 lines of code vs 20KB+ library

**3. Programmatic Navigation**
- **Decision:** Components call `router.navigate()` instead of using callbacks
- **Reasoning:** Decouples components from parent, URLs reflect state
- **Benefits:** Bookmarkable, shareable, browser history works

**4. Route-Based Rendering**
- **Decision:** Route handlers control what renders
- **Reasoning:** Single source of truth for app state (the URL)
- **Benefits:** Predictable, testable, easier to reason about

**5. Singular vs Plural URL Paths**
- **Decision:** Use plural paths (`/posts/drafts`, `/posts/published`)
- **Reasoning:** Matches REST conventions, reads better
- **Implementation:** Map filter values to plural URLs explicitly

#### Testing Achievements

**Test Suite Growth:**
- Added 35 new tests (23 router + 12 updated component tests)
- Total: 106 tests passing (was 71)
- All following TDD approach
- Router: 23 tests covering pattern matching, navigation, history
- Components: Updated to test router integration

**Test Categories:**
- Route registration and pattern matching (6 tests)
- Dynamic route parameters (4 tests)
- Navigation and history (5 tests)
- Browser back/forward (2 tests)
- Edge cases (6 tests)
- Component integration with router (12 tests)

#### Current Capabilities

**What Works:**
1. ✅ All previous functionality maintained
2. ✅ Clean URLs for all views (`/posts`, `/posts/drafts`, etc.)
3. ✅ Direct navigation to specific posts via URL
4. ✅ Bookmarkable URLs for posts and views
5. ✅ Browser back/forward buttons work correctly
6. ✅ Refresh maintains current view
7. ✅ Shareable URLs to specific posts or filters
8. ✅ Routing works with auto-save and auto-load
9. ✅ All 106 tests passing

**What's Missing:**
1. ❌ Settings page (route planned, not implemented)
2. ❌ Theme system
3. ❌ Export to HTML/Markdown/ZIP
4. ❌ Custom EditorJS blocks (YouTube, Spacer)
5. ❌ Search/filter posts by title
6. ❌ Keyboard shortcuts

#### Performance Notes

**Current Performance:**
- ✅ Route changes are instant (<10ms)
- ✅ No noticeable lag when navigating
- ✅ Browser back/forward responsive
- ✅ URL updates don't cause flicker
- ✅ Router adds minimal overhead (~2KB)

**Bundle Impact:**
- Router implementation: ~150 lines (~4KB uncompressed)
- No external dependencies added
- Minimal impact on bundle size
- Maintains performance targets

#### Next Priority

**Phase 1 Complete!** All core infrastructure is now in place:
- ✅ Editor, storage, auto-save, routing, images
- ✅ 106 tests passing with excellent coverage
- ✅ Full post management with trash
- ✅ Clean, bookmarkable URLs

**Moving to Phase 2: Theme System**
According to PLAN.md, the next phase focuses on:
1. CSS theme engine with per-post selection
2. Default themes (minimal, serif)
3. Theme selector component
4. Typography system (Minor Third scale)
5. Live theme preview

---

### 2026-01-06 (Continued): Theme System Scaffolding

#### Theme System Strategy

**Decision: CSS Variables + Dynamic Stylesheet Loading**
- **Reasoning:**
  - CSS Zen Garden approach - themes are pure CSS
  - No JavaScript needed in theme files
  - Full control over styling with CSS custom properties
  - Live preview by loading theme CSS dynamically
  - Easy for theme authors to create new themes
- **Implementation:**
  - Base CSS with all default variables
  - Theme files only override variables
  - Editor loads base.css + selected theme
  - WYSIWYG: editor sees exactly what will be exported

**URL Structure:**
```
/settings                  # New route for settings
```

#### CSS Architecture

**Created three CSS files:**

1. **`src/themes/base.css`** - Foundation with CSS variables
   - All default values for colors, typography, spacing
   - Complete styling for all EditorJS blocks
   - Applies to `.post-content` class only (not app UI)
   - Typography scale: Minor Third (1.2 ratio)
   - Variables include:
     - Colors (background, text, accent, border)
     - Font sizes (base through 4xl)
     - Spacing (xs through 2xl)
     - Font families (base, heading, mono)
     - Line heights (tight, normal, loose)
     - Content max-width (65ch)

2. **`src/themes/minimal.css`** - Minimal theme
   - White background (#ffffff - later changed to #cccccc for testing)
   - Clean, simple overrides
   - Scaffolding: only background color for now

3. **`src/themes/modern.css`** - Modern theme
   - Off-white background (#f5f5f0)
   - Warm, contemporary feel
   - Scaffolding: only background color for now

**Design Decision: Scaffolding Only**
- For now, themes only override background color
- This validates the architecture works
- Full theme styling (typography, spacing, colors) to be built out next
- Easier to test theme switching mechanism

#### Theme Engine Implementation (TDD)

**Created `src/core/theme-engine.js` with 16 tests:**

**Functions:**
1. `loadTheme(themeName)` - Loads base.css + theme CSS dynamically
2. `getActiveTheme()` - Returns currently loaded theme
3. `setDefaultTheme(themeName)` - Saves default theme to IndexedDB
4. `getDefaultTheme()` - Gets default theme (fallback: 'minimal')
5. `_resetThemeEngine()` - Testing helper to reset state

**How Theme Loading Works:**
```javascript
// 1. Load base.css first (if not already loaded)
<link rel="stylesheet" href="/src/themes/base.css" data-theme="base">

// 2. Remove any existing theme stylesheet
// 3. Load new theme CSS
<link rel="stylesheet" href="/src/themes/minimal.css" data-theme="minimal">

// Result: base CSS variables + theme overrides
```

**Key Features:**
- Async loading with Promise-based waiting
- Prevents duplicate base.css loading
- Removes old theme before loading new one
- Stores active theme in memory
- Persists default theme in IndexedDB settings table

#### Settings View Implementation (TDD)

**Created `src/components/settings-view.js` with 6 tests:**

**Features:**
1. **Settings Header:**
   - "← Back" button navigates to /posts
   - Clean, simple header

2. **Themes Section:**
   - Dropdown select for default theme
   - Options: Minimal, Modern
   - Shows currently selected default theme
   - Help text explaining default vs per-post override

3. **Live Theme Switching:**
   - On dropdown change:
     - Save to IndexedDB (`setDefaultTheme`)
     - Load theme immediately (`loadTheme`)
     - No page refresh needed!
   - User sees background color change instantly

**Route Integration:**
- Added `/settings` route to main.js
- Renders settings view in sidebar
- Added "⚙️ Settings" button to post list footer

#### Integration with Editor

**Changes to `main.js`:**
1. Import theme engine functions
2. Load default theme on editor ready
3. Apply theme to editor area (`.post-content` class)
4. Settings route renders settings view

**Changes to `index.html`:**
1. Added `.post-content` class to `#editor-container`
2. Theme CSS now applies to editor area
3. Added CSS for settings view components
4. Added CSS for footer buttons (Trash + Settings)

**Editor sees WYSIWYG:**
- Editor container has `.post-content` class
- Base CSS + theme CSS both load
- CSS variables cascade into editor
- Background color, fonts, spacing all themed
- What you see in editor = what exports to HTML

#### Testing Achievements

**Test Suite Growth:**
- Added 22 new tests (16 theme engine + 6 settings view)
- Total: 124 tests passing (was 106)
- All following TDD approach

**Test Categories:**
- Theme loading and switching (6 tests)
- Active theme tracking (2 tests)
- Default theme persistence (4 tests)
- CSS injection and DOM manipulation (4 tests)
- Settings UI rendering (3 tests)
- Settings interaction (3 tests)

**Testing Challenges Solved:**
1. **State persistence between tests**
   - Problem: activeTheme variable persisted across tests
   - Solution: Added `_resetThemeEngine()` helper function

2. **Database persistence between tests**
   - Problem: Default theme setting persisted
   - Solution: Added database cleanup to theme engine tests
   - Impact: Each test starts with clean slate

#### Files Created

**Theme CSS:**
- `src/themes/base.css` - Base variables and styles (180 lines)
- `src/themes/minimal.css` - Minimal theme overrides (11 lines)
- `src/themes/modern.css` - Modern theme overrides (11 lines)

**Theme Engine:**
- `src/core/theme-engine.js` - Theme loading logic (90 lines)
- `src/core/theme-engine.test.js` - 16 comprehensive tests

**Settings View:**
- `src/components/settings-view.js` - Settings UI component (62 lines)
- `src/components/settings-view.test.js` - 6 component tests

#### Files Modified

**Integration:**
- `src/main.js` - Load theme on init, add /settings route
- `src/components/post-list.js` - Add Settings button to footer
- `index.html` - Add `.post-content` class, settings CSS

#### Key Implementation Decisions

**1. CSS-Only Themes**
- **Decision:** Themes are pure CSS variable overrides
- **Reasoning:** Simple for theme authors, no JavaScript needed
- **Benefits:** Easy to create, maintain, and share themes

**2. Base + Theme Pattern**
- **Decision:** Always load base.css, then theme CSS
- **Reasoning:** Theme only needs to override specific variables
- **Benefits:** Themes stay small, consistent behavior

**3. Live Loading**
- **Decision:** Load theme CSS immediately when selection changes
- **Reasoning:** Better UX, see changes instantly
- **Implementation:** Call `loadTheme()` on dropdown change

**4. Settings in IndexedDB**
- **Decision:** Store default theme in settings table
- **Reasoning:** Persist across sessions, simple key-value storage
- **Benefits:** Already built, no new infrastructure needed

**5. Scaffolding First**
- **Decision:** Only implement background color in themes initially
- **Reasoning:** Validate architecture before full implementation
- **Benefits:** Can test switching mechanism, confirm it works

**6. .post-content Scoping**
- **Decision:** Only apply theme CSS to `.post-content` elements
- **Reasoning:** App UI stays consistent, only content is themed
- **Benefits:** Themes can't break app UI, clear separation

#### Current Capabilities

**What Works:**
1. ✅ Settings page accessible via /settings route
2. ✅ Theme selector dropdown (Minimal, Modern)
3. ✅ Save default theme to IndexedDB
4. ✅ Load default theme on editor startup
5. ✅ Live theme switching (instant, no refresh)
6. ✅ Background color changes in editor
7. ✅ CSS variables architecture in place
8. ✅ Base CSS styles all EditorJS blocks
9. ✅ WYSIWYG editor preview
10. ✅ All 124 tests passing

**What's Next:**
1. ❌ Build out full theme CSS (typography, spacing, colors, not just background)
2. ❌ Per-post theme override (dropdown in editor, not just default)
3. ❌ Load post-specific theme when switching posts
4. ❌ Additional themes (serif, dark, etc.)
5. ❌ Theme preview (visual thumbnails of themes)
6. ❌ Custom theme creation/import

#### Performance Notes

**Current Performance:**
- ✅ Theme loading: < 50ms (two CSS files)
- ✅ Theme switching: Instant visual update
- ✅ No noticeable performance impact
- ✅ CSS file sizes: ~5KB total (base + theme)

**Bundle Impact:**
- Theme engine: ~90 lines (~2KB)
- Settings view: ~60 lines (~1.5KB)
- Theme CSS: ~200 lines total (~5KB)
- No external dependencies

---

### 2026-01-15: Responsive Theme System Complete

#### Responsive Typography Implementation

**Decision: Implement fluid typography using CSS `clamp()`**
- **Reasoning:**
  - Smooth scaling from mobile to desktop (no jarring breakpoints)
  - Better reading experience across all device sizes
  - Follows modern CSS best practices
  - Matches PLAN.md specification for fluid type scale
- **Implementation:**
  - Updated `base.css` with responsive font sizes
  - All sizes scale smoothly: mobile (320px) → desktop (1200px+)
  - Example: `--font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)` (16px → 18px)

#### Responsive Spacing Implementation

**Decision: Make all spacing variables responsive**
- **Reasoning:**
  - Tighter spacing on mobile for efficient screen use
  - More generous spacing on desktop for comfortable reading
  - Consistent with fluid typography approach
- **Implementation:**
  - All `--space-*` variables now use `clamp()`
  - Added `--content-padding` variable for responsive padding
  - Updated `.post-content` to use responsive padding

#### Full Theme CSS Buildout

**Decision: Complete Minimal and Modern themes with distinct personalities**

**Minimal Theme:**
- Pure white background (#ffffff)
- High contrast text for maximum readability
- Extra generous whitespace (looser spacing)
- Looser line heights (1.6 normal, 1.8 loose)
- Philosophy: "Remove everything unnecessary, let content breathe"

**Modern Theme:**
- Warm off-white background (#fafaf8)
- Reduced contrast for softer feel
- Slightly larger base font (17px vs 16px on mobile)
- Balanced spacing (middle ground)
- More generous padding
- Philosophy: "Comfortable reading with a touch of personality"

**Key Differences:**
| Aspect | Minimal | Modern |
|--------|---------|--------|
| Background | Pure white (#fff) | Warm off-white (#fafaf8) |
| Base font | 16px → 18px | 17px → 19px |
| Line height | 1.6 (looser) | 1.65 (balanced) |
| Spacing | More generous | Balanced |
| Accent | Bright blue (#0066ff) | Modern blue (#3b82f6) |

#### Files Modified

- `src/themes/base.css` - Added responsive `clamp()` typography and spacing
- `src/themes/minimal.css` - Full theme with distinct personality
- `src/themes/modern.css` - Full theme with warm, contemporary feel

#### Phase 2 Status: COMPLETE ✅

**Theme System Deliverables:**
- ✅ CSS variables architecture with responsive fluid typography
- ✅ Theme engine with dynamic loading
- ✅ Default theme selection in settings
- ✅ Live theme switching (instant, no refresh)
- ✅ Two distinct themes (Minimal, Modern)
- ✅ WYSIWYG editing (editor shows themed content)

**Deferred to Post-v1.0:**
- Per-post theme override (nice-to-have, not essential for MVP)
- Additional themes (serif, dark)
- Theme preview thumbnails

#### Next Priority: Export & Content Publishing

With local editing fully functional, the next major milestone is getting content out:

1. **Export System (Phase 4)** ✅ COMPLETE
   - Generate HTML from EditorJS blocks
   - Generate Markdown alongside HTML
   - Bundle into ZIP with optimized images and CSS
   - Download functionality

2. **Content Publishing (Phase 5)** 🚧 CURRENT
   - One-click publish user's blog content to Netlify/Vercel/GitHub Pages
   - Publish modal UI with platform selection
   - Publishing progress and status feedback

This completes the core "write locally" experience. Content publishing completes the "publish anywhere" promise. (The app stays local - only the content goes online!)

---

### 2026-01-16: Export System Complete - Ready for Content Publishing

#### Export System Implementation (TDD)

**Phase 4 completed with all export features working:**

1. **HTML Generator** (`src/exporter/html-generator.js`)
   - Renders all EditorJS block types to HTML
   - Paragraph, header (H1-H6), list, quote, code, image
   - Handles inline HTML formatting (bold, italic, links)
   - HTML escaping for code blocks
   - Image paths converted to WebP in `./images/` directory
   - 55 tests passing

2. **Markdown Generator** (`src/exporter/markdown-generator.js`)
   - Converts EditorJS blocks to Markdown
   - `convertInlineHTMLToMarkdown()` handles `<b>`, `<i>`, `<a>`, `<code>`
   - Proper handling of nested formatting (bold + italic = `***text***`)
   - Quote blocks with captions
   - Fenced code blocks
   - Image references with WebP paths
   - 45 tests passing

3. **ZIP Bundler** (`src/exporter/bundler.js`)
   - Creates complete export package with JSZip
   - Structure: `index.html`, `index.md`, `images/`, `css/theme.css`
   - Combines base.css + theme CSS using Vite `?raw` imports
   - Optimizes images to WebP during export
   - Handles EditorJS content structure (`post.content.blocks`)
   - 15 tests passing

4. **Export Button UI**
   - One-click "Export ZIP" button in editor toolbar
   - Loading state ("Exporting...") during export
   - Error handling with visual feedback
   - Triggers browser download of `{post-slug}.zip`
   - Download utility in `src/utils/download.js`

#### Bug Fixes During Integration

**Several issues discovered and fixed during real-world testing:**

1. **Editor flashing on save** - Route handler was reloading editor on every save
   - Fix: Only refresh sidebar post list, not full route

2. **Export button greyed out on load** - `updateExportButton()` not called after initial load
   - Fix: Added `'loaded'` status emission in auto-save, called update after route handler

3. **Empty content in exports** - `post.content` is `{blocks: [...]}`, not array
   - Fix: Access `post.content?.blocks || []` in bundler

4. **List items TypeError** - EditorJS stores items as objects `{content, items}` for nested lists
   - Fix: Handle both string and object items in both generators

5. **Title not in HTML body** - HTML template was missing title in article
   - Fix: Added `<h1>${title}</h1>` inside article body

#### Testing Achievements

- **Total Tests:** 224 passing ✅
- **Export module tests:** 114 tests
  - HTML generator: 55 tests
  - Markdown generator: 45 tests
  - Bundler: 15 tests
  - Download utility: 4 tests
- **Test coverage:** On track for 85%+ target

#### Files Created/Modified

**Created:**
- `src/exporter/html-generator.js` - EditorJS → HTML renderer
- `src/exporter/html-generator.test.js` - 55 tests
- `src/exporter/markdown-generator.js` - EditorJS → Markdown renderer
- `src/exporter/markdown-generator.test.js` - 45 tests
- `src/exporter/bundler.js` - ZIP packaging with JSZip
- `src/exporter/bundler.test.js` - 15 tests
- `src/utils/download.js` - Browser file download utility
- `src/utils/download.test.js` - 4 tests

**Modified:**
- `src/main.js` - Export button integration, status handling fixes
- `src/core/auto-save.js` - Added 'loaded' status emission
- `index.html` - Added export button to toolbar

#### Phase 4 Status: COMPLETE ✅

**Export System Deliverables:**
- ✅ HTML generator with all block types
- ✅ Markdown generator with inline formatting conversion
- ✅ ZIP bundler with optimized images and theme CSS
- ✅ One-click export button in editor
- ✅ Download utility for browser file download
- ✅ 224 tests passing

#### Next Priority: CONTENT PUBLISHING (Phase 5)

**The local writing experience is complete!** The app can:
- Create, edit, and manage blog posts
- Store images with optimization
- Apply themes with live preview
- Export to ZIP with HTML, Markdown, images, and CSS

**Now users need to publish their content online.** The Write Local *app* stays local (that's the whole point!). Phase 5 is about letting users publish their *blog content* to hosting platforms.

**What to Build:**
1. Publish modal UI (platform selection, progress feedback)
2. Platform integrations (Netlify, Vercel, GitHub Pages APIs)
3. OAuth authentication flows
4. Use MSW to mock API responses in tests

**Post-Publishing MVP:**
- Keyboard shortcuts
- Additional themes
- Documentation

---

### 2026-01-16 (Continued): Netlify Publishing Complete

#### Netlify Publishing Implementation

**Phase 5 core functionality implemented with TDD:**

1. **MSW Test Infrastructure** (`tests/mocks/handlers.js`, `tests/mocks/server.js`)
   - Mock Netlify API responses for all endpoints
   - Server lifecycle hooks in `tests/setup.js`
   - Enables reliable testing without hitting real API

2. **Auth Storage** (`src/publisher/auth-storage.js`)
   - Store/retrieve/delete OAuth tokens in IndexedDB
   - Platform-agnostic design (supports future Vercel/GitHub)
   - 5 tests passing

3. **Netlify OAuth** (`src/publisher/netlify-oauth.js`)
   - Popup-based OAuth flow with state parameter for CSRF protection
   - Token extraction from URL hash (implicit grant)
   - 6 tests passing

4. **Netlify API Client** (`src/publisher/netlify-api.js`)
   - `listSites()` - Get user's existing Netlify sites
   - `createSiteWithDeploy()` - Create new site with ZIP deploy
   - `deployToSite()` - Deploy to existing site
   - `waitForDeployReady()` - Poll until deploy completes
   - **CORS workaround:** Netlify API returns duplicate `Access-Control-Allow-Origin` headers which browsers reject. Implemented detection and recovery by checking if the resource was created despite the error.
   - 8 tests passing

5. **Deploy Service** (`src/publisher/deploy-service.js`)
   - Orchestrates the full publish workflow
   - Uses `createExportBundle()` to generate ZIP
   - Handles new site creation or deploy to existing site
   - Progress callbacks for UI feedback
   - 5 tests passing

6. **Publish View** (`src/components/publish-view.js`)
   - "Connect to Netlify" button with OAuth flow
   - Site selector dropdown for existing sites
   - "Create new site" option
   - Publishing progress indicator
   - Success state with live URL link
   - Error handling with retry option
   - Marks post as published after success
   - 13 tests passing

#### Bug Fixes During Integration

1. **`finalStatus.id` undefined in CORS recovery path**
   - Problem: Variable wasn't defined when using CORS workaround
   - Fix: Use `finalDeployId` variable initialized from `deployResult.id`

2. **New site URL showing "undefined"**
   - Problem: CORS recovery didn't include URL fields in deploy object
   - Fix: Added `ssl_url`, `url`, `deploy_ssl_url` to returned deploy object

3. **Alt text not appearing in published HTML**
   - Problem: EditorJS stores alt text in `block.tunes.altText.alt`, but generators looked at `block.data.alt`
   - Fix: Updated `html-generator.js` and `markdown-generator.js` to accept tunes parameter and extract alt from correct location

4. **Theme not included in published content**
   - Problem: Posts created with `theme: 'default'` but bundler only had 'minimal'/'modern'
   - Fix: Updated bundler to check settings for default theme when post.theme is 'default'

5. **Theme styles not loading on custom domain**
   - Problem: CSS files loaded via `<link>` tags with `/src/themes/` paths didn't work on custom domain (writelocal.test vs localhost)
   - Fix: Refactored theme engine to bundle CSS at build time using Vite's `?raw` import suffix and inject as `<style>` tags

#### Theme Engine Refactor

**Major change to `src/core/theme-engine.js`:**

**Before:**
```javascript
// Dynamic <link> tag loading
const link = document.createElement('link');
link.href = `/src/themes/${themeName}.css`;
document.head.appendChild(link);
```

**After:**
```javascript
// Bundled CSS with Vite ?raw imports
import baseCSS from '../themes/base.css?raw';
import minimalCSS from '../themes/minimal.css?raw';
import modernCSS from '../themes/modern.css?raw';

// Inject as <style> tags
const style = document.createElement('style');
style.setAttribute('data-theme', themeName);
style.textContent = themeCSS;
document.head.appendChild(style);
```

**Benefits:**
- Works regardless of domain or server configuration
- CSS bundled into JavaScript at build time
- No runtime network requests for themes
- Themes work in deployed/exported content

**Test Setup Update:**
- Added `vi.mock()` calls in `tests/setup.js` for `?raw` CSS imports
- Theme engine tests now pass with mocked CSS content

#### Files Created

**Publisher Module:**
- `src/publisher/auth-storage.js` + `.test.js` - Token management
- `src/publisher/netlify-oauth.js` + `.test.js` - OAuth flow
- `src/publisher/netlify-api.js` + `.test.js` - API client
- `src/publisher/deploy-service.js` + `.test.js` - Deployment orchestration

**Components:**
- `src/components/publish-view.js` + `.test.js` - Publish UI

**Test Infrastructure:**
- `tests/mocks/handlers.js` - MSW request handlers
- `tests/mocks/server.js` - MSW server setup

#### Files Modified

- `src/main.js` - Added /publish route and Publish button
- `src/core/theme-engine.js` - Refactored to use bundled CSS
- `src/core/theme-engine.test.js` - Updated for new implementation
- `src/exporter/html-generator.js` - Alt text from tunes
- `src/exporter/markdown-generator.js` - Alt text from tunes
- `src/exporter/bundler.js` - Get theme from settings
- `tests/setup.js` - Added MSW lifecycle + CSS mocks
- `index.html` - Publish button in toolbar
- `.env.example` - Added `VITE_NETLIFY_CLIENT_ID`

#### Known Limitations & Future Work

**1. Themes are currently global, not per-post**
- Current: All posts use the default theme from settings
- Needed: Per-post theme selection stored in post record
- Architecture: Need to distinguish "global settings" vs "post-specific settings"

**2. Each publish creates a separate Netlify site**
- Current: Publishing a post creates a new site (or deploys to an existing one)
- Needed: A "blog" concept where multiple posts are published to a single site
- Architecture considerations:
  - Index page listing all published posts
  - Shared navigation/layout across posts
  - RSS feed generation
  - Sitemap generation
  - URL structure: `mysite.netlify.app/post-slug/`

**3. CORS workaround is fragile**
- Netlify's API returns duplicate `Access-Control-Allow-Origin` headers
- Current workaround: Catch error, wait, check if resource was created
- Better solution: Netlify to fix their API headers

#### Current Capabilities

**What Works:**
1. ✅ Connect to Netlify via OAuth
2. ✅ List existing Netlify sites
3. ✅ Create new site with published post
4. ✅ Deploy to existing site
5. ✅ Progress indicator during publishing
6. ✅ Success message with live URL
7. ✅ Post marked as "published" after success
8. ✅ Theme styles included in published HTML
9. ✅ Alt text included in published images
10. ✅ All 261 tests passing

**What's Missing:**
1. ❌ Multi-post blog (single site with multiple posts)
2. ❌ Per-post theme selection
3. ❌ Vercel integration
4. ❌ GitHub Pages integration
5. ❌ Index page generation
6. ❌ RSS feed generation

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
