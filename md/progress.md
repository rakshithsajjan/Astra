# Progress Log

_Last update: 2025-06-29_

## Completed (Phase 1)
- [x] Tab-strip toggle button (`ai-sidebar-toggle-button`) added next to + tab.
- [x] Sidebar container (`#ai-sidebar`) created; opens/closes on button click.
- [x] Sidebar moved to right edge; page area shrinks via `webviews.adjustMargin`.
- [x] Drag-to-resize handle added (min 270 px, max 50 % window) with width persistence.
- [x] Smooth CSS slide animation (160 ms) on open/close.
- [x] Learning note logged about `data-label` localisation trap.

## TODO — Chat AI Implementation (Phase 2)
Progressive mini-tasks so each slice is testable:

### UI Scaffolding
- [x] Create `css/aiChat.css` with basic layout (message area + input bar).
- [x] Add `js/aiChatUI.js` that injects static mock messages for dev.
- [x] Wire Chat UI into `aiSidebar.js` so it loads when sidebar opens.

### Minimal Send/Receive (non-streaming)
- [x] Create `js/aiChatClient.js` with POST to Groq API (no stream).
- [x] Pipe user input → Groq → full assistant response bubble.
- [x] Basic error bubble on non-200.

### Streaming Support
- [x] Switch client to `stream=true`; handle SSE chunks.
- [x] Typing caret while streaming.

### Conversation Persistence
- [x] Schema bump to Dexie `version(2)` adding `aiChat` table.
- [x] Load history on sidebar open; append new rows after each message.
- [x] add a history icon inside the sidebar where the user cam access past chats (UI only).

### Conversation Tabs within Sidebar
- [x] UI tab-strip component inside sidebar (`aiChatTabs.js`).
- [x] IndexedDB `aiConversations` table `{id,name,created,lastActive}` (tabs persist across sessions).

### Context Tagging
- [ ] Implement drag-drop of browser tab onto chat pane to attach context.
- [ ] Parse `@TabTitle` mention and resolve to tabId.
- [ ] Store links in `aiChatTabLinks` table.

### Agent Mode Skeleton
- [ ] Toggle switch between Normal / Agent mode.
- [ ] Stub IPC channel to main process for agent commands.

---
**Note:** After each checkbox is completed, run & test before moving to the next to avoid large breakages.
