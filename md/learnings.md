# Learnings from AI Sidebar Pane Debugging

- **Electron Webviews Override z-index**  
  No standard `z-index` value can place regular DOM elements above a `<webview>`; they render in a separate GPU layer. Overlays must instead use Min's placeholder system to blur/disable the webview while the overlay is shown.

- **Use `webviews.requestPlaceholder(name)` / `webviews.hidePlaceholder(name)`**  
  These utility methods pause/blur webviews and allow UI layers like the Task Overlay (and now the AI sidebar) to appear on top.

- **Overlay Pattern**  
  Implement overlays as full-screen fixed containers (`position: fixed; top:0; left:0; width:100%; height:100%; z-index:3`) that contain their own right-aligned sidebar panel.

- **Avoid Shrinking the Navbar**  
  Earlier attempts reduced the navbar width, hiding tab titles. Instead, only shift the content area (`#webviews`, `#searchbar`) when necessary or overlay on top.

- **Dynamic Placeholder vs. Layout Shift**  
  The placeholder approach (blur) is less intrusive than layout shifting and avoids needing to re-calculate widths for every element.

- **Debugging Visibility**  
  Start with an obvious background color (bright red) and thick borders to confirm element placement. Gradually refine styling once placement is verified.

- **CommonJS vs. ES Modules in Browserify Build**  
  Browserify in Min expects CommonJS. Using `export {}` caused build errors; switch to `module.exports`.

- **Positioning Below Navbar**  
  Task overlay ignores navbar height; our initial sidebar needed adjustment. Using a full-screen overlay avoids navbar clipping issues.

- **Console Logging & DevTools**  
  Insert temporary logs (`console.log`) and dashed outlines to verify element creation, toggle state, and bounding boxes.

- **Iterative Approach**  
  Strip features to the minimum viable pane first, confirm correctness, then layer functionality (chat UI, context, etc.) gradually.

- **Layout Shift with `webviews.adjustMargin`**  
  Calling `webviews.adjustMargin([0, WIDTH, 0, 0])` safely pushes the BrowserView left by `WIDTH` pixels, making room for fixed sidebars without needing an overlay or placeholder blur.

- **Symmetric Margin Reset**  
  When hiding the sidebar, reverse the margin with `webviews.adjustMargin([0, -WIDTH, 0, 0])` to restore the full viewport.

- **Body Class Hook**  
  A `body.ai-sidebar-open` class can be toggled to let other fixed-position UI elements (like `#searchbar`) apply matching `margin-right` via CSS.

- **Fixed-Width Sidebar Panel**  
  Once the BrowserView is shifted, a `position: fixed; right: 0; width: WIDTHpx` panel renders fine—no z-index workarounds required.

- **Single Source of Truth for Width**  
  Store the sidebar width in a JS constant (e.g., `SIDEBAR_WIDTH`) and mirror it in CSS to keep layout calculations in sync.

- **Localization Trap – `data-label` Must Map to a String**  
  Min's renderer parses every `[data-label]` on startup and throws if the key isn't found in `localization/languages/*.json`. Adding a button with a new `data-label` (e.g., `toggleAISidebar`) without a matching translation key aborts script execution, resulting in a blank window and disabled DevTools. Fix: either add translations for the key or omit the `data-label` attribute.

- **Infinite Rebuild Loop with `chokidar`**  
  `chokidar` (used in `scripts/watch.js`) can create an infinite rebuild loop if it watches directories where build outputs are written (e.g., `dist/`). This causes the application to constantly restart, preventing changes from rendering. Fix: Exclude output directories (e.g., `dist`) from `chokidar`'s watch paths using the `ignored` option.

- **Concatenation Build System for Main Process**  
  The build script (`scripts/buildMain.js`) is a simple file concatenator, not a true bundler. This means local `require('./file.js')` statements will fail at runtime because the path context is lost in the final `main.build.js` file. Dependencies between local main-process files must be managed by creating global objects and relying on the concatenation order defined in the build script's module list.

- **Main Process Does Not Auto-Load .env**  
  The main Electron process does not automatically load environment variables from a `.env` file. The `dotenv` package must be installed and configured at the very top of the main entry script (`main/main.js`) by calling `require('dotenv').config()`. This ensures `process.env` is populated before any other modules (like API clients) are initialized.

- **`dotenv` and Concatenation Order**  
  With a file concatenation build system, `require('dotenv').config()` must be called at the top of the *first script that needs the environment variables* (e.g., `main/aiChatAPI.js`), not necessarily the main entry point (`main/main.js`). Due to the concatenation order, placing it in `main.js` may cause it to run *after* the module needing the variables has already been defined with `undefined` values.
