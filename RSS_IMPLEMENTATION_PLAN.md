# RSS Feed Implementation Plan

## Overview

Add automatic RSS feed generation to WriteLocal, similar to the automatic archive page generation. The RSS feed will be generated as `feed.xml` at the site root and included in the site bundle ZIP.

## Key Design Decisions

### 1. GUID Strategy (Post Identity)

**Problem**: RSS readers use GUIDs to track posts. If a GUID changes, readers treat it as a new post (causing duplicates).

**Options**:
- **Option A**: Use post URL as GUID (e.g., `https://example.com/my-post/`)
  - Pros: Standard practice, human-readable
  - Cons: If slug changes, GUID changes (duplicate post in readers)

- **Option B**: Use post ID as GUID (e.g., `urn:uuid:abc123`)
  - Pros: Never changes even if slug changes
  - Cons: Not a clickable URL

**Decision**: Use **post URL as GUID** with `isPermaLink="true"`
- More standard practice in RSS feeds
- Simpler for users to understand
- **Recommendation**: Consider preventing slug changes after a post is published, OR warn users that changing slug creates a new GUID

### 2. Handling Post Updates

**Problem**: When a user edits a published post, how do we signal this to RSS readers?

**Decision**: Follow RSS best practices:
- `<pubDate>`: Original publication date from `post.publishedAt` (NEVER changes)
- `<atom:updated>`: Use Atom namespace to indicate last update from `post.updatedAt`
- RSS readers can then show "Updated" indicator without treating it as new

**XML Structure**:
```xml
<item>
  <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
  <atom:updated>2024-01-15T14:30:00Z</atom:updated>
</item>
```

### 3. Content in Feed

**Problem**: Should we include full post HTML or just an excerpt?

**Decision**: Make it **configurable per-site**:
- `site.feedIncludeFullContent = false` (default): Use excerpt (50 words + "...")
- `site.feedIncludeFullContent = true`: Include full rendered HTML in `<content:encoded>`

**Rationale**:
- Excerpt: Smaller feed file, drives traffic to site
- Full content: Better reader experience, works offline in feed readers

### 4. RSS vs Atom

**Decision**: Use **RSS 2.0** (not Atom)
- More widely supported by feed readers
- Simpler XML structure
- Can still use Atom namespace for `<atom:updated>` (standard practice)

### 5. Feed Metadata Location

**Decision**: Store in `sites` table (not separate settings)
- Each site has its own feed configuration
- Makes sense with multi-site architecture
- Keeps all site-related config together

## Data Model Changes

### Sites Table - New Fields

Add these fields to the `sites` table:

```javascript
{
  // Existing fields
  id: 'uuid',
  name: 'My Blog',
  archiveTitle: 'Blog Posts',
  archiveTemplate: 'simple-list',
  archiveTheme: 'minimal',
  platform: 'netlify',
  platformSiteId: 'abc123',
  platformUrl: 'https://myblog.netlify.app',
  createdAt: timestamp,
  updatedAt: timestamp,
  lastPublishedAt: timestamp,

  // NEW: RSS feed configuration
  siteUrl: 'https://myblog.netlify.app',  // Base URL for RSS links
  blogDescription: 'My thoughts on web development', // <description>
  feedAuthor: 'Jane Doe (jane@example.com)', // Optional: <managingEditor>
  feedLanguage: 'en-us',                    // <language>
  feedIncludeFullContent: false,            // Excerpt vs full HTML
}
```

**Notes**:
- `siteUrl` can be set automatically when deploying (from `platformUrl`)
- `blogDescription` defaults to empty string (users can set in site settings)
- `feedAuthor` is optional (can be null)
- `feedLanguage` defaults to `'en-us'`
- `feedIncludeFullContent` defaults to `false` (excerpt mode)

**Schema Migration**:
- These are all **optional** fields (nullable)
- Existing sites will have null values → use sensible defaults
- No schema version bump needed if using `updateSite()` to add fields

## Implementation Files

### 1. RSS Generator (`src/exporter/rss-generator.js`)

**Purpose**: Generate RSS 2.0 XML feed from posts and site config.

**API**:
```javascript
/**
 * Generate RSS 2.0 feed XML
 * @param {Array} posts - Array of published posts
 * @param {Object} siteConfig - Site configuration
 * @param {string} siteConfig.siteUrl - Base URL (e.g., 'https://myblog.com')
 * @param {string} siteConfig.name - Blog name
 * @param {string} siteConfig.blogDescription - Feed description
 * @param {string} [siteConfig.feedAuthor] - Author (RFC 822 format)
 * @param {string} [siteConfig.feedLanguage='en-us'] - Language code
 * @param {boolean} [siteConfig.feedIncludeFullContent=false] - Full vs excerpt
 * @returns {string} RSS XML document
 */
export function generateRSSFeed(posts, siteConfig)
```

**Helper Functions**:
```javascript
// Format timestamp to RFC 822 date (required by RSS)
// Example: "Mon, 02 Jan 2006 15:04:05 GMT"
export function formatRFC822Date(timestamp)

// Format timestamp to ISO 8601 (for atom:updated)
// Example: "2006-01-02T15:04:05Z"
function formatISO8601Date(timestamp)

// Escape XML special characters (different from HTML!)
function escapeXML(text)

// Generate a single RSS <item> element
function generateRSSItem(post, siteConfig)
```

**RSS Structure**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>My Blog</title>
    <link>https://myblog.com/</link>
    <description>My thoughts on web development</description>
    <language>en-us</language>
    <lastBuildDate>Mon, 15 Jan 2024 10:00:00 GMT</lastBuildDate>
    <atom:link href="https://myblog.com/feed.xml" rel="self" type="application/rss+xml"/>
    <managingEditor>jane@example.com (Jane Doe)</managingEditor>

    <item>
      <title>My First Post</title>
      <link>https://myblog.com/my-first-post/</link>
      <guid isPermaLink="true">https://myblog.com/my-first-post/</guid>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
      <atom:updated>2024-01-15T14:30:00Z</atom:updated>
      <description><![CDATA[This is an excerpt from my first post with about 50 words...]]></description>
      <!-- If feedIncludeFullContent=true: -->
      <content:encoded><![CDATA[
        <h1>Full Post Title</h1>
        <p>Full HTML content here...</p>
      ]]></content:encoded>
    </item>

    <!-- More items... -->
  </channel>
</rss>
```

**Key Implementation Details**:

1. **XML Escaping vs HTML Escaping**:
   - XML requires escaping: `&`, `<`, `>`, `"`, `'`
   - Use `<![CDATA[...]]>` for content with HTML to avoid double-escaping
   - Title should be plain text (escaped)
   - Description/content should be wrapped in CDATA

2. **Date Formatting**:
   - RSS requires RFC 822: `formatRFC822Date(timestamp)`
   - Atom requires ISO 8601: `formatISO8601Date(timestamp)`
   - Use JavaScript's `toUTCString()` for RFC 822
   - Use `toISOString()` for ISO 8601

3. **Content Generation**:
   - Excerpt mode: Use `generateExcerpt(post.content.blocks, 50)`
   - Full content: Use `renderBlocksToHTML(post.content.blocks, { imagePathPrefix: '/images/' })`

4. **Sorting**:
   - Sort posts by `publishedAt` descending (newest first)
   - Only include posts where `publishedAt !== null`

5. **Item Count**:
   - Standard practice: Include last 10-20 posts
   - We'll include all published posts (simpler, static site approach)

### 2. RSS Generator Tests (`src/exporter/rss-generator.test.js`)

**Test Coverage** (TDD approach):

```javascript
describe('RSS Generator', () => {
  describe('formatRFC822Date', () => {
    it('formats timestamp as RFC 822 date')
    it('uses GMT timezone')
    it('handles various timestamps correctly')
  });

  describe('generateRSSFeed', () => {
    // Basic structure
    it('generates valid RSS 2.0 XML')
    it('includes required channel elements')
    it('includes XML declaration')
    it('includes RSS namespaces (atom, content)')

    // Channel metadata
    it('sets channel title from site name')
    it('sets channel link from siteUrl')
    it('sets channel description from blogDescription')
    it('sets language from feedLanguage')
    it('sets lastBuildDate to most recent post publishedAt')
    it('includes atom:link self-reference')
    it('includes managingEditor if feedAuthor provided')
    it('omits managingEditor if feedAuthor is null')

    // Items
    it('includes all published posts as items')
    it('sorts items by publishedAt descending')
    it('excludes draft posts')
    it('generates correct item structure')

    // Item metadata
    it('sets item title from post title')
    it('sets item link to post URL')
    it('sets guid to post URL with isPermaLink=true')
    it('formats pubDate as RFC 822')
    it('includes atom:updated if post was modified')
    it('omits atom:updated if publishedAt === updatedAt')

    // Item content
    it('uses excerpt in description when feedIncludeFullContent=false')
    it('includes full HTML in content:encoded when feedIncludeFullContent=true')
    it('wraps HTML content in CDATA')
    it('escapes XML special characters in title')

    // Edge cases
    it('handles empty posts array')
    it('handles posts with no content blocks')
    it('handles posts with special characters in title')
    it('handles posts with HTML in title (should strip)')
    it('handles missing optional fields gracefully')

    // Content rendering
    it('renders image URLs correctly in full content')
    it('generates valid excerpt for description')
    it('handles posts with no text content (images only)')
  });
});
```

**Estimated test count**: ~30 tests

### 3. Site Bundler Integration

**Update `src/exporter/site-bundler.js`**:

```javascript
import { generateRSSFeed } from './rss-generator.js';

export async function createSiteBundle(siteId, options = {}) {
  // ... existing code ...

  // Generate archive page
  const archiveHTML = generateArchiveHTML(posts, {
    archiveTitle: site.archiveTitle,
    archiveTemplate: site.archiveTemplate,
    archiveTheme: site.archiveTheme,
  });
  zip.file('index.html', archiveHTML);

  // NEW: Generate RSS feed
  if (site.siteUrl) {
    const rssFeed = generateRSSFeed(posts, {
      siteUrl: site.siteUrl,
      name: site.name,
      blogDescription: site.blogDescription || '',
      feedAuthor: site.feedAuthor || null,
      feedLanguage: site.feedLanguage || 'en-us',
      feedIncludeFullContent: site.feedIncludeFullContent || false,
    });
    zip.file('feed.xml', rssFeed);
  }

  // ... rest of existing code ...
}
```

**Note**: Only generate RSS feed if `site.siteUrl` exists (site has been deployed).

### 4. Archive Page Integration

**Update `src/exporter/archive-generator.js`**:

Add RSS autodiscovery link to `<head>`:

```javascript
export function generateArchiveHTML(posts, siteConfig) {
  // ... existing code ...

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="stylesheet" href="./css/archive.css">
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="./feed.xml">
</head>
<body>
  <!-- ... existing body ... -->
</body>
</html>`;
}
```

This allows:
- Browsers to show RSS icon in address bar
- Feed readers to auto-detect the feed
- Users to subscribe easily

### 5. Deployment Integration

**Update `src/publisher/deploy-service.js`** (or wherever deployment happens):

After successful deployment, update the site's `siteUrl`:

```javascript
async function deployToNetlify(siteId) {
  // ... deployment code ...

  // After successful deploy:
  await updateSite(siteId, {
    platform: 'netlify',
    platformSiteId: deployResult.site_id,
    platformUrl: deployResult.ssl_url,
    siteUrl: deployResult.ssl_url,  // NEW: Set siteUrl for RSS
    lastPublishedAt: Date.now(),
  });
}
```

### 6. Site Settings UI (Future)

**Add RSS configuration fields** to site settings UI (when Phase E is implemented):

```javascript
// Site Settings Form
{
  name: "My Blog",
  archiveTitle: "Blog Posts",
  archiveTemplate: "simple-list",
  archiveTheme: "minimal",

  // NEW: RSS Feed Settings section
  blogDescription: "My thoughts on web development",
  feedAuthor: "Jane Doe (jane@example.com)",
  feedLanguage: "en-us",
  feedIncludeFullContent: false,  // Checkbox: "Include full post content in RSS feed"
}
```

## Testing Strategy

### Unit Tests (TDD)

**Test file**: `src/exporter/rss-generator.test.js`

1. **Date formatting tests** (5 tests):
   - RFC 822 format correctness
   - ISO 8601 format correctness
   - Timezone handling (GMT/UTC)
   - Edge cases (epoch, far future)

2. **XML generation tests** (10 tests):
   - Valid XML structure
   - Required elements present
   - Namespaces correct
   - CDATA wrapping
   - XML escaping

3. **Channel metadata tests** (8 tests):
   - All required channel elements
   - Optional elements (author, language)
   - Default values
   - Edge cases (empty description, etc.)

4. **Item generation tests** (10 tests):
   - Required item elements
   - GUID format and isPermaLink
   - Date formatting
   - Sorting (newest first)
   - Filtering (published only)

5. **Content tests** (7 tests):
   - Excerpt mode
   - Full content mode
   - HTML rendering in content
   - Image paths
   - Empty content

**Total**: ~30 tests

### Integration Tests

**Test workflow**: Create site → Add posts → Generate bundle → Verify feed.xml

```javascript
// tests/integration/rss-workflow.test.js
describe('RSS Workflow', () => {
  it('generates feed.xml when site has siteUrl', async () => {
    const site = await createSite({
      name: 'Test Blog',
      siteUrl: 'https://test.com',
      blogDescription: 'Test description'
    });

    // Create published posts
    const post = await createPost({ title: 'Test Post', content: [] });
    await updatePost(post.id, {
      siteId: site.id,
      status: 'published',
      publishedAt: Date.now()
    });

    // Generate bundle
    const zipBlob = await createSiteBundle(site.id);
    const zip = await JSZip.loadAsync(zipBlob);

    // Verify feed.xml exists
    const feedXML = await zip.file('feed.xml').async('string');
    expect(feedXML).toContain('<?xml version="1.0"');
    expect(feedXML).toContain('<rss version="2.0"');
    expect(feedXML).toContain('<title>Test Post</title>');
  });

  it('does not generate feed.xml when siteUrl is missing', async () => {
    const site = await createSite({ name: 'Test Blog' }); // No siteUrl
    // ... create posts ...

    const zipBlob = await createSiteBundle(site.id);
    const zip = await JSZip.loadAsync(zipBlob);

    // feed.xml should not exist
    expect(zip.file('feed.xml')).toBeNull();
  });
});
```

### Manual Testing Checklist

Once implemented, test with real RSS readers:

- [ ] Validate XML with [W3C Feed Validator](https://validator.w3.org/feed/)
- [ ] Test feed in popular readers:
  - [ ] Feedly
  - [ ] NewsBlur
  - [ ] Inoreader
  - [ ] Apple Mail RSS
- [ ] Verify GUID stability (edit post, check no duplicate in reader)
- [ ] Verify update detection (modify post, check reader shows update)
- [ ] Test excerpt vs full content modes
- [ ] Test special characters in titles/content
- [ ] Test with posts that have images

## Edge Cases & Considerations

### 1. No Published Posts

**Scenario**: Site exists but has no published posts.

**Behavior**: Generate feed with empty channel (no `<item>` elements).

**Reasoning**: Valid RSS, indicates the feed exists but is empty.

### 2. Missing siteUrl

**Scenario**: Site created but not yet deployed (no `siteUrl`).

**Behavior**: Skip RSS generation entirely.

**Reasoning**: Cannot generate valid RSS without absolute URLs.

### 3. Post Slug Changes

**Scenario**: User changes post slug after publishing.

**Current behavior**: GUID changes (URL-based GUID).

**Impact**: RSS readers will show it as a NEW post (duplicate).

**Options**:
1. Accept this behavior (document it)
2. Warn user when changing slug of published post
3. Switch to ID-based GUID (`isPermaLink="false"`)

**Recommendation**: Start with Option 1 (document), consider Option 2 for UX improvement later.

### 4. Very Long Content

**Scenario**: Post with 5000+ words.

**Excerpt mode**: No issue (50 words).

**Full content mode**: Large feed file, but acceptable for static sites.

**Mitigation**: None needed (most blogs don't have that many posts).

### 5. Special Characters & Encoding

**Scenarios**:
- Post title with quotes, ampersands
- Content with code blocks, HTML
- Non-English characters (emoji, accents)

**Solution**: Use proper XML escaping and CDATA:
- Titles: Escape `&`, `<`, `>`, `"`, `'`
- Content: Wrap in `<![CDATA[...]]>` (no escaping needed)
- Encoding: UTF-8 declaration in XML header

### 6. Image URLs in RSS

**Full content mode**: Images must use absolute URLs.

**Current**: `renderBlocksToHTML()` uses `imagePathPrefix` (e.g., `/images/`).

**Solution**: Pass `imagePathPrefix: 'https://example.com/images/'` when rendering for RSS.

**Implementation**:
```javascript
const contentHTML = renderBlocksToHTML(post.content.blocks, {
  imagePathPrefix: `${siteConfig.siteUrl}/images/`
});
```

### 7. Atom Updated Element

**When to include**:
- If `post.updatedAt > post.publishedAt` (post was modified after publishing)

**When to omit**:
- If `post.updatedAt === post.publishedAt` (never modified)

**Implementation**:
```javascript
const wasUpdated = post.updatedAt > post.publishedAt;
const atomUpdated = wasUpdated
  ? `    <atom:updated>${formatISO8601Date(post.updatedAt)}</atom:updated>`
  : '';
```

## Implementation Timeline (TDD)

### Phase 1: RSS Generator Core (2-3 hours)
1. 🔴 Write tests for `formatRFC822Date`
2. 🟢 Implement date formatting
3. 🔴 Write tests for basic RSS structure
4. 🟢 Implement `generateRSSFeed` skeleton
5. 🔴 Write tests for channel metadata
6. 🟢 Implement channel generation
7. 🔵 Refactor for code quality

### Phase 2: Item Generation (2 hours)
1. 🔴 Write tests for item structure
2. 🟢 Implement `generateRSSItem`
3. 🔴 Write tests for GUID and dates
4. 🟢 Implement GUID and date handling
5. 🔵 Refactor

### Phase 3: Content Handling (1-2 hours)
1. 🔴 Write tests for excerpt mode
2. 🟢 Implement excerpt description
3. 🔴 Write tests for full content mode
4. 🟢 Implement content:encoded
5. 🔵 Refactor

### Phase 4: Integration (1 hour)
1. Update `site-bundler.js` to call `generateRSSFeed`
2. Write integration tests
3. Update archive page with RSS link
4. Update deployment to set `siteUrl`

### Phase 5: Testing & Polish (1-2 hours)
1. Manual testing with RSS validators
2. Test with real feed readers
3. Fix any issues discovered
4. Update documentation

**Total estimated time**: 7-10 hours of focused development

## Documentation Updates

### For Users (README/Docs)

Add section on RSS feeds:

```markdown
### RSS Feed

WriteLocal automatically generates an RSS feed for your published blog. The feed is available at `/feed.xml` and includes:

- **Automatic discovery**: Browsers and feed readers can auto-detect your feed
- **Standard format**: RSS 2.0 with Atom extensions for update tracking
- **Configurable**: Choose between excerpt (default) or full content in feed

**Configuration** (in Site Settings):
- **Blog Description**: Short description of your blog (appears in feed)
- **Feed Author**: Your name and email (optional, RFC 822 format: "Name (email)")
- **Feed Language**: Language code (default: en-us)
- **Include Full Content**: Show full posts vs excerpts in feed readers

**Important**:
- Feed is only generated after your site is deployed (requires site URL)
- Changing a post's URL slug after publishing will create a new entry in feed readers
```

### For Developers (CLAUDE.md)

Update with RSS implementation details:

```markdown
## RSS Feed System

**Location**: `src/exporter/rss-generator.js`

**Purpose**: Generate RSS 2.0 feed with Atom extensions for multi-post blogs.

**Key Functions**:
- `generateRSSFeed(posts, siteConfig)` - Main generator
- `formatRFC822Date(timestamp)` - RSS-compliant date format

**Integration**:
- Called by `site-bundler.js` during site export
- Output: `feed.xml` at site root
- Archive page includes RSS autodiscovery link

**GUID Strategy**:
- Uses post URL as GUID (`isPermaLink="true"`)
- **Warning**: Changing post slug creates new GUID (appears as new post in readers)

**Update Handling**:
- `<pubDate>`: Original `post.publishedAt` (never changes)
- `<atom:updated>`: Set if `post.updatedAt > post.publishedAt`

**Testing**: See `src/exporter/rss-generator.test.js` (~30 tests)
```

## Success Criteria

Implementation is complete when:

- [ ] All RSS generator tests pass (~30 tests)
- [ ] Integration tests verify feed.xml in bundle
- [ ] Feed validates with W3C Feed Validator
- [ ] Feed displays correctly in 3+ popular feed readers
- [ ] Excerpt mode and full content mode both work
- [ ] Post updates are correctly detected by readers (no duplicates)
- [ ] Archive page includes RSS autodiscovery link
- [ ] Documentation updated

## Future Enhancements

These are NOT part of initial implementation but worth noting:

1. **Podcast RSS**: Add `<enclosure>` support for audio files (if adding audio posts)
2. **Categories**: Add `<category>` elements (if adding post tags/categories)
3. **Media RSS**: Add media:content for image thumbnails
4. **Feed pagination**: Limit to last N posts, provide archive feeds
5. **Multiple feeds**: Per-category feeds, per-tag feeds
6. **Atom feed**: Generate Atom 1.0 in addition to RSS 2.0
7. **JSON Feed**: Generate JSON Feed format (newer standard)

## References

- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [Atom Namespace in RSS](https://www.w3.org/2005/Atom)
- [RSS Best Practices](https://www.rssboard.org/rss-profile)
- [W3C Feed Validator](https://validator.w3.org/feed/)
- [RFC 822 Date Format](https://www.rfc-editor.org/rfc/rfc822)
