# Min AI Enhancement Project Plan

## Project Overview

**Vision**: Add systematic AI features to Min browser, developed methodically in phases:
1. AI Chat Sidebar with tab context awareness
2. Knowledge Base ("second brain")
3. Autonomous Web Agent
4. Vertical Tabs with AI-based grouping

**Timeline**: One week for MVP, solo developer, zero budget  
**Platform**: macOS first, Windows later  
**Distribution**: DMG with auto-updates

## Core Features & Priority

### 1. AI Chat Sidebar (Highest Priority)
- Toggleable sidebar UI
- Tab context via @ mentions
- Message history
- LLM integration (OpenAI API)
- Keyboard shortcut (⌥⌘A)

### 2. Knowledge Base
- Automatic page content extraction
- Graph database storage
- No pruning/expiry
- Full-text + embedding search
- No encryption required

### 3. Autonomous Agent
- Web automation via Stagehand/Browserless
- Task scheduling & execution
- Safety confirmations
- Example flows:
  - Hotel booking from calendar
  - Email responses
  - Price comparisons

### 4. Vertical Tabs & Groups
- Side-mounted tab strip
- Context-based grouping
- Collapsible sections
- Drag-drop support preserved

## Technical Architecture

### Frontend
- Vanilla JS (no React)
- Min's existing CSS patterns
- New files:
  - `js/aiSidebar.js`
  - `css/aiSidebar.css`
  - `js/aiTabGrouper.js`

### Backend
- Main process: `main/aiAgent.js`
- Renderer process: `js/aiAgentClient.js`
- Database: Dexie/IndexedDB
- IPC channels:
  - `ai-sidebar-open`
  - `ai-kb-save`
  - `ai-agent`

### External Services
- OpenAI API for LLM/embeddings
- No calendar/email API integration yet

## Implementation Phases

### Phase 0: Setup (Day 0-1)
1. Fork setup & tooling
2. CI pipeline
3. Development environment

### Phase 1: Vertical Tabs (Day 1-3)
1. Sidebar container
2. Tab strip refactor
3. Basic grouping UI
4. Stub AI categorization

### Phase 2: AI Chat (Day 2-5)
1. Sidebar toggle
2. Chat UI components
3. LLM integration
4. Tab context system

### Phase 3: Knowledge Base (Day 3-6)
1. Page capture hooks
2. Database schema
3. Embedding pipeline
4. Search interface

### Phase 4: Agent MVP (Day 4-7)
1. Stagehand setup
2. Basic automation
3. Safety UI
4. Example task flow

### Phase 5: Release (Day 7)
1. Performance optimization
2. Documentation
3. DMG build & release

## Development Workflow

### Environment Setup
1. Clone Min
2. Create private repo `min-ai`
3. Configure StandardJS + Prettier
4. Set up electron-builder

### Testing & Quality
- Jest for unit tests
- Playwright for E2E
- Eval set for AI performance
- Coverage target: 60%

### Playwright E2E Testing
Playwright has been successfully configured to launch the Min browser and interact with its pages, enabling robust end-to-end testing and laying the groundwork for autonomous browsing.

**How Programmatic Access Was Achieved: A Detailed Journey**

The path to achieving comprehensive programmatic control over Min, including access to its internal tab and task management, involved several iterations of research, testing, and problem-solving. The primary goal was to move beyond simple user input simulation to direct interaction with the browser's underlying state.

**1. Initial Playwright Setup and Connection Attempts:**

   The first step involved installing Playwright (`npm install playwright`) and attempting to connect to a running Min instance. Initial attempts utilized `chromium.connectOverCDP` with the `--remote-debugging-port` flag. However, consistent `ECONNREFUSED` errors indicated that the CDP port was either not being exposed correctly or was inaccessible.

   *Initial Hypothesis:* The `npm run startElectron` command, which runs a built version of the main process, might not have been correctly applying the `--remote-debugging-port` flag, or there were timing issues during application startup.

   *Solution:* To ensure Playwright had full control over the launch process and the debugging port, the strategy shifted to using Playwright's `_electron.launch` method. This method directly launches the Electron application and allows for precise control over command-line arguments, guaranteeing the `--remote-debugging-port=9222` flag was applied.

**2. Discovering and Accessing Internal State (`window.tasks.getCopyableState()`):**

   A critical requirement was to obtain a real-time overview of all open tabs and their associated tasks. The initial roadmap from the OpenAI LLM suggested `window.getMinTabInfo()` which internally uses `ipc.invoke('get-all-tabs-data')`. However, direct calls to `window.getMinTabInfo()` from Playwright's `appWindow.evaluate()` consistently returned `null` or `undefined`.

   *Problem Diagnosis:* Extensive logging within both the renderer process (`js/browserUI.js`) and the main process (`main/main.js`) revealed that the `ipc.invoke` call from the renderer was not reliably hitting the `ipc.handle` in the main process when initiated from Playwright's `evaluate` context. This indicated a sandboxing or context isolation issue within Playwright's `evaluate` environment, preventing direct access to certain global objects or proper IPC mechanisms.

   *Breakthrough Solution:* Instead of relying on the problematic `window.getMinTabInfo()` (which uses IPC), it was discovered that the `window.tasks` global object in the renderer process directly holds the tab and task state. This object has a `getCopyableState()` method that returns a serializable JSON representation of all tasks and tabs. By using `appWindow.evaluate(() => window.tasks.getCopyableState())`, and crucially, waiting for `window.tasks` to be defined using `appWindow.waitForFunction('window.tasks !== undefined')`, reliable programmatic access to the browser's full tab and task overview was achieved.

**3. Programmatic Tab Navigation and Switching (Overcoming Sandboxing):**

   With direct internal function calls (`window.webviews.update()`, `window.browserUI.addTab()`) also failing due to the `evaluate` sandboxing, a more robust approach was needed for tab navigation and switching.

   *Solution for Navigation:* Instead of directly manipulating the webview, navigation was achieved by simulating user input into the application's searchbar (`#tab-editor-input`). By typing the desired URL into this input field and simulating an 'Enter' key press, the application's native navigation logic was triggered, successfully loading the URL in the active tab.

   *Solution for Tab Switching:* Similarly, programmatic tab switching was implemented by simulating a click on the tab's corresponding UI element. Each tab in Min's UI is represented by a `div` with the class `tab-item` and a `data-tab` attribute set to the tab's unique ID. By using Playwright's `appWindow.click(`.tab-item[data-tab="${tabId}"]`)`, the application's native tab-switching mechanism was engaged, ensuring all associated side-effects (like updating the active webview) occurred correctly.

**4. Handling Tab Lifecycle and State Management:**

   A recurring challenge was the dynamic nature of tab IDs, particularly when empty tabs were automatically destroyed upon new tab creation or navigation. This led to `initialTabId` becoming invalid and Playwright timing out when trying to find non-existent elements.

   *Solution:* The test script was refined to capture the `initialTabId` *before* any navigation or new tab creation that might invalidate it. Furthermore, the initial tab was explicitly navigated to a non-empty URL (e.g., `https://example.com`) using the searchbar method. This ensured the initial tab persisted and its ID remained valid for subsequent switching operations.

**Summary of Programmatic Capabilities:**

*   **Full Tab and Task Overview:** Reliable retrieval of a detailed JSON object representing all open tabs and their task groupings, including URLs, titles, and selection status, via `window.tasks.getCopyableState()`.
*   **Programmatic Navigation:** Ability to navigate any active tab to a specified URL by simulating user input into the searchbar.
*   **Programmatic Tab Switching:** Ability to switch between existing tabs by simulating clicks on their UI elements.

This comprehensive approach, combining direct state access with robust user input simulation where necessary, provides a powerful foundation for building advanced autonomous browsing features and thorough end-to-end testing within the Min browser.

**Test Script (`playwright_test.js`):**

The provided `playwright_test.js` script demonstrates these capabilities. It launches the Electron application, navigates an initial tab to `https://example.com`, creates a new tab, navigates it to `https://www.google.com`, retrieves the updated tab state, and then switches back to the original tab. This script serves as a robust foundation for developing further end-to-end tests and autonomous browsing features.

To run the tests, use the following command:
```
node playwright_test.js
```

### Build & Deploy
- GitHub Actions for CI/CD
- DMG notarization
- Auto-updates via electron-updater

## Performance Goals
- Lightweight memory footprint
- Support 20-30 concurrent tabs
- Local-only storage
- Lazy-load embeddings

## Documentation
- Markdown format
- Detailed developer guides
- API references
- User documentation

## Future Considerations
- Desktop-only for now
- Evaluate cloud sync later
- Consider plugin system
- Monitor storage growth

## Success Metrics
- Functional eval set
- User testing feedback
- Performance benchmarks
- Memory profiling

## Licensing & Community
- Apache 2.0 license
- Community contributions TBD 

## Updated AI Chat Requirements (June 2025)

1. **Conversation Tabs inside Sidebar**  
   • The sidebar hosts its *own* tab-strip; switching browser tabs does **not** switch the active chat.  
   • New chat tab opens with ⌘T within sidebar; user can rename chats.

2. **Page-Tagging for Context**  
   • User can drag a browser tab into the chat or type `@TabTitle` to attach it.  
   • Attached tab's URL + (optionally) scraped text are sent as context with the next prompt.

3. **Multiple Chat Modes**  
   • **Normal Mode** – Standard LLM Q&A.  
   • **Agent Mode** – Grants an autonomous agent (powered by the Browserless API) permission to open/close tabs, click links, fill forms, etc., based on natural-language instructions.

4. **Agent Mode Technical Notes**  
   • Uses the open-source `browserless` library running in a headless Chrome container.  
   • Main process spawns tasks; renderer shows live log/steps in the chat stream.  
   • Safety gate: every potentially destructive action (purchase, form submit) requires user confirmation.

5. **IndexedDB Storage**  
   • Conversation objects: `{id, name, created, lastActive}`.  
   • Messages reference conversationId, not browser tab.  
   • Tab-tag links stored in a join table: `{convId, tabId, ts}`. 

## Local Knowledge Graph & Semantic Search

To create a "second-brain" of every page the user visits, we will store structured metadata *and* embeddings locally. We have chosen **SQLite + sqlite-vss** as the foundational datastore.

### Intent & Purpose
1. Persist every visited page (`url`, `title`, timestamp, raw text) in a `pages` table.
2. Store a 1 536-D float32 embedding for each page, enabling semantic recall ("Find articles similar to …").
3. Maintain explicit edges (`page_links`) for a graph of navigation, tags, or manual relationships.
4. Expose fast ANN queries from the chat sidebar and future autonomous agents.

### Why SQLite + sqlite-vss?
|  | Pros | Cons |
|---|------|------|
|Single-file DB|Easy backup with user profile; no daemon|Large writes lock the file (use batched inserts)|
|Relational SQL|Graph traversals & joins without extra store|Less ergonomic than pure graph DB DSL|
|Built-in FTS5|Keyword search alongside vector ANN|FTS index ~ size of raw text|
|`vss0` extension|HNSW ANN good to ~1 M vectors|Must ship native dylib for each OS|
|Cross-platform|Same code paths mac / win / linux|Need runtime loading logic per platform|
|Mature ecosystem|`better-sqlite3`, `knex`, many tools|None significant|

### Initial Schema Sketch
```sql
-- Vector table
CREATE TABLE pages (
  id        INTEGER PRIMARY KEY,
  url       TEXT UNIQUE,
  title     TEXT,
  domain    TEXT,
  ts        INTEGER,           -- first visit
  embedding BLOB,             -- 1536-float32
  content   TEXT              -- optional raw text/html
);
CREATE VIRTUAL TABLE pages_idx USING vss0(embedding(1536));

-- Graph edges
CREATE TABLE page_links (
  fromId INT,
  toId   INT,
  weight REAL,
  PRIMARY KEY(fromId, toId)
);
CREATE INDEX idx_links_from ON page_links(fromId);
```

Queries:
```sql
-- Top-10 semantically similar pages to vector :vec
SELECT url, title FROM pages
JOIN pages_idx ON pages.id = pages_idx.rowid
WHERE pages_idx.match_embedding(:vec, 10);
```

We will implement the SQLite layer in Phase 3 alongside the knowledge-base ingestion pipeline. 