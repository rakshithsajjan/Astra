const { _electron } = require('playwright');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  try {
    console.log('Launching Electron application...');
    const electronApp = await _electron.launch({ args: ['.'] });
    console.log('Successfully launched Electron application.');

    let appWindow;
    for (let i = 0; i < 10; i++) {
        const windows = await electronApp.windows();
        for (const w of windows) {
            if (await w.title() === 'Min') {
                appWindow = w;
                break;
            }
        }
        if (appWindow) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!appWindow) {
        const windows = await electronApp.windows();
        console.log('Available windows:');
        for (const w of windows) {
            console.log(`- ${await w.title()}`);
        }
        throw new Error("Min main window not found");
    }

    console.log('Min main window found.');

    // Get the ID of the initially selected tab
    let initialTabStateBeforeNav = await appWindow.evaluate(() => window.tasks.getCopyableState());
    let initialTabId = null;
    for (const task of initialTabStateBeforeNav.tasks) {
        const selectedTab = task.tabs.find(t => t.selected);
        if (selectedTab) {
            initialTabId = selectedTab.id;
            break;
        }
    }

    if (!initialTabId) {
        throw new Error("No initial selected tab found.");
    }

    // Navigate the initial tab to a known URL to prevent it from being destroyed
    console.log('Navigating initial tab to example.com via searchbar...');
    await appWindow.type('#tab-editor-input', 'https://example.com');
    await appWindow.press('#tab-editor-input', 'Enter');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give it time to load

    // After navigation, the initialTabId should still refer to the selected tab
    // We don't need to re-find it, as the navigation happens in the same tab.

    console.log('Getting initial tab state after navigation...');
    const initialTabStateAfterNav = await appWindow.evaluate(() => window.tasks.getCopyableState());
    console.log(JSON.stringify(initialTabStateAfterNav, null, 2));

    console.log('Creating a new tab with Google.com...');
    await appWindow.click('#add-tab-button');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await appWindow.type('#tab-editor-input', 'https://www.google.com');
    await appWindow.press('#tab-editor-input', 'Enter');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Getting updated tab state...');
    const updatedTabState = await appWindow.evaluate(() => window.tasks.getCopyableState());
    console.log(JSON.stringify(updatedTabState, null, 2));

    console.log('Switching back to the initial tab...');
    // Wait for the tab element to be present and visible
    await appWindow.waitForSelector(`.tab-item[data-tab="${initialTabId}"]`, { state: 'visible' });
    await appWindow.click(`.tab-item[data-tab="${initialTabId}"]`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Getting final tab state...');
    const finalTabState = await appWindow.evaluate(() => window.tasks.getCopyableState());
    console.log(JSON.stringify(finalTabState, null, 2));

    await electronApp.close();
    console.log('Application closed.');
    process.exit(0);
  } catch (error) {
    console.error('Playwright test failed:', error);
    process.exit(1);
  }
})();