# Plan: Add AI Sidebar Toggle Icon to Tab Bar (Phase 1.1)

Goal: Visually surface a button in the tab strip that will eventually toggle the AI chat sidebar. In this slice, we only add the icon next to the current "New Tab" (+) button; no functional sidebar opening/closing yet.

---
## Relevant Existing Assets
1. **HTML entry point** – [`index.html`](mdc:index.html)  
   • `#navbar` contains `.navbar-right-actions` holding the existing `#add-tab-button` (+) element.
2. **Button patterns** – [`js/navbar/addTabButton.js`](mdc:js/navbar/addTabButton.js) & class `navbar-action-button`.  
   These provide a template for a one-off JS initializer module and default styling.
3. **Global bootstrap** – [`js/default.js`](mdc:js/default.js)  
   Modules listed here are `require(...).initialize()`-ed on startup.
4. **Icon set** – Carbon iconfont already loaded via `ext/icons/iconfont.css`.

---
## Implementation Steps

### 1  Mark-up
• Inside `<div class="navbar-right-actions">` add:
```html
<button
  id="ai-sidebar-toggle-button"
  class="navbar-action-button i carbon:side-panel-right"
  data-label="toggleAISidebar"
  tabindex="-1"
></button>
```
– Placed *before* `#add-tab-button` so the + remains rightmost (consistent muscle memory).

### 2  JavaScript Initialiser
• Create `js/navbar/aiSidebarToggleButton.js` mirroring `addTabButton.js`:
```js
var toggleBtn = document.getElementById('ai-sidebar-toggle-button')
function initialize () {
  toggleBtn.addEventListener('click', () => {
    /* placeholder – functionality will arrive in later phases */
    document.body.classList.toggle('ai-sidebar-open')
  })
}
module.exports = { initialize }
```
– Only toggles a CSS class for now to prove wiring.

### 3  Bootstrap Hook
• In `js/default.js` add after `require('navbar/addTabButton.js').initialize()`:
```js
require('navbar/aiSidebarToggleButton.js').initialize()
```

### 4  CSS (Optional)
• Re-use existing `.navbar-action-button` styles.  
• If needed, add a selector in `css/tabBar.css` to slightly adjust spacing (e.g., margin-right) so the two buttons don't collide.

### 5  Smoke Test Checklist
1. Run dev build; confirm new button appears right of tab strip.
2. Hover state & click ripple match other navbar buttons.
3. Clicking toggles `body.ai-sidebar-open` class without errors in devtools console.
4. No layout regression when window is narrow / `compact-tabs` mode.

---
## Future Work (out-of-scope for this slice)
• Implement `js/aiSidebar.js` overlay & sidebar panel.  
• Keyboard shortcut ⌥⌘A triggers same toggle.  
• Hook up state persistence, margin shift (`webviews.adjustMargin`) & placeholder blur.

---
### Estimated Effort
< 30 minutes (HTML + small JS + one bootstrap line + manual test).

### Risk & Mitigation
One-liner HTML edit could create merge conflicts; isolate change and run linter. The button uses Carbon icon names—verify chosen `carbon:side-panel-right` exists; fallback to `carbon:apps` if missing.

---
## Phase 1.2 — Move Sidebar to the Right & Make It Resizable

Goal:  
1. Shift the AI sidebar panel to the right edge of the viewport (mirroring many chat-style assistants).  
2. Allow users to drag the sidebar's inner border (left edge) to resize its width within sensible limits.

### UX & Behaviour
1. **Default Position** – Sidebar slides in/out from the right; plus-tab button remains unchanged.  
2. **Resize Handle** – When hovering the sidebar's left border, cursor changes to col-resize.  
3. **Live Resize** – Dragging adjusts width in real-time; webview area reflows concurrently.  
4. **Width Limits** – Min = 270 px; Max = 50 % of `window.innerWidth`. Clamp drag values accordingly.  
5. **Persistence** – Remember last width in `settings.js` so next toggle/open uses prior size.  
6. **Accessibility** – Keyboard fallback: `⌥⌘←` / `⌥⌘→` to shrink/expand in 40 px increments.

### Technical Implementation Steps
1. **CSS Adjustments**  
   • Change `#ai-sidebar { right: 0; left: auto; }` and switch `border-right` → `border-left`.  
   • Add `#ai-sidebar-resize-handle` – 4 px-wide absolutely positioned div anchored to left edge; `cursor: col-resize`.
2. **DOM Setup**  
   • Inside `createSidebar()` append the resize-handle element.  
   • Give it `draggable=false` to avoid text-drag ghosting.
3. **Drag Logic**  
   • On `mousedown` over handle → attach `mousemove` listener to `window`.  
   • Compute newWidth = clamp(window.innerWidth - e.clientX, 270, window.innerWidth / 2).  
   • Apply width to sidebar via inline style and simultaneously call `webviews.adjustMargin([0, prev-delta, 0, -newDelta])` to keep margins accurate. Store `prevWidth` so deltas are easy.
4. **Performance**  
   • Throttle resize handler (e.g., `throttle(fn, 16)` for ~60 fps).  
   • On `mouseup` remove listeners and persist width to settings.
5. **Settings Persistence**  
   • Add key `aiSidebarWidth` (default 320).  
   • On init, read value and set sidebar width before first open.
6. **Keyboard Shortcuts**  
   • Extend `defaultKeybindings.js` with `option+cmd+[`arrow`]` to call `aiSidebar.resizeBy(delta)` (which internally clamps & persists).
7. **Edge-Cases**  
   • Window resize: clamp current width again (so it never exceeds 50 %).  
   • Fullscreen or narrow windows: if `(window.innerWidth < minWidth + 400)` auto-collapse sidebar when opening.

### Testing Checklist
- [ ] Open/close still works with animation.  
- [ ] Dragging handle resizes smoothly; webview keeps exact alignment.  
- [ ] Cannot shrink below 270 px or grow beyond half-screen.  
- [ ] Width survives app restart (settings persistence).  
- [ ] Keyboard shortcuts resize appropriately.  
- [ ] RTL languages verify border placement (though sidebar likely only in LTR context for now).

### Estimated Effort
~1.5 hrs (CSS tweaks, resize logic, persistence, thorough testing). 