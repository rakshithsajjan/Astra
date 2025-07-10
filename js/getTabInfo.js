// Import required modules (if running in Min's renderer process)
const tabs = require('tabs');
const tasks = require('tasks');
const ipc = require('ipc');

/**
 * Get detailed information about all tabs in the current window.
 * @returns {Array} Array of tab objects with properties like id, url, title, etc.
 */
function getAllTabInfo() {
  const allTabs = [];
  
  // Iterate through all tasks (groups of tabs)
  tasks.getAll().forEach(task => {
    // Iterate through all tabs in the current task
    task.tabs.getAll().forEach(tab => {
      allTabs.push({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        isPrivate: tab.private,
        isSelected: tab.id === tabs.getSelected(),
        taskId: task.id,
        taskName: task.name
      });
    });
  });

  return allTabs;
}

/**
 * Get info for the currently selected tab.
 * @returns {Object} Tab object with properties like id, url, title, etc.
 */
function getCurrentTabInfo() {
  const currentTabId = tabs.getSelected();
  if (!currentTabId) return null;

  const tab = tabs.get(currentTabId);
  const task = tasks.getTaskContainingTab(currentTabId);

  return {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    isPrivate: tab.private,
    taskId: task.id,
    taskName: task.name
  };
}

// Example usage:
console.log('All tabs:', getAllTabInfo());
console.log('Current tab:', getCurrentTabInfo()); 