'use strict'

const { db } = require('util/database.js')

let initialised = false
let tabsEl
const tabMap = new Map() // tabEl -> conversationId

function emitSelect (id) {
  window.dispatchEvent(new CustomEvent('ai-chat-conversation-selected', { detail: { id } }))
  // update lastActive
  db && db.aiConversations && db.aiConversations.update(id, { lastActive: Date.now() }).catch(() => {})
}

async function createTab (title = 'New Chat', conversationId = null) {
  let convId = conversationId
  if (!convId) {
    // create record in DB
    if (db && db.aiConversations) {
      convId = await db.aiConversations.add({ name: title, created: Date.now(), lastActive: Date.now() })
    } else {
      convId = Date.now()
    }
  }
  const tab = document.createElement('div')
  tab.className = 'chat-tab'
  tab.textContent = title

  const closeBtn = document.createElement('span')
  closeBtn.className = 'close-btn'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    closeTab(tab)
  })
  tab.appendChild(closeBtn)

  tab.addEventListener('click', () => activateTab(tab))

  tab.dataset.convId = convId
  tabMap.set(tab, convId)
  return tab
}

function activateTab (tab) {
  if (!tab) return
  tabsEl.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'))
  tab.classList.add('active')
  const id = tabMap.get(tab)
  if (id) emitSelect(id)
}

function closeTab (tab) {
  const isActive = tab.classList.contains('active')
  const next = tab.nextElementSibling || tab.previousElementSibling
  tab.remove()
  tabMap.delete(tab)
  if (isActive && next) {
    activateTab(next)
  }
}

async function render (toolbarEl) {
  if (initialised || !toolbarEl) return

  // Tab strip container
  tabsEl = document.createElement('div')
  tabsEl.id = 'ai-chat-tabs'

  // Load existing conversations
  let convRows = []
  if (db && db.aiConversations) {
    try { convRows = await db.aiConversations.orderBy('created').toArray() } catch (e) {}
  }

  if (convRows.length === 0) {
    const tab = await createTab('Chat')
    tab.classList.add('active')
    tabsEl.appendChild(tab)
    emitSelect(tabMap.get(tab))
  } else {
    for (const row of convRows) {
      const tab = await createTab(row.name || 'Chat', row.id)
      if (row === convRows[0]) {
        tab.classList.add('active')
        emitSelect(row.id)
      }
      tabsEl.appendChild(tab)
    }
  }

  // Insert at the beginning of the toolbar so tabs appear at left, history icon at right
  toolbarEl.prepend(tabsEl)

  // Keyboard shortcuts: Option+Cmd or UI controlled elsewhere; we'll use toolbar + button triggers outside.
  window.addEventListener('keydown', keyHandler)

  initialised = true
}

function keyHandler (e) {
  if (!document.body.classList.contains('ai-sidebar-open')) return
  if (!(e.altKey && e.metaKey) || e.ctrlKey || e.shiftKey) return

  if (e.key.toLowerCase() === 't') {
    e.preventDefault()
    createTab('Chat').then(tab => {
      tabsEl.appendChild(tab)
      activateTab(tab)
    })
  } else if (e.key.toLowerCase() === 'w') {
    e.preventDefault()
    const active = tabsEl.querySelector('.chat-tab.active')
    if (active) {
      closeTab(active)
    }
  }
}

function createNewTab () {
  createTab('Chat').then(tab => {
    tabsEl.appendChild(tab)
    activateTab(tab)
  })
}

/**
 * Ensure a tab representing the given conversation id is visible and active.
 */
async function openConversation (convId) {
  // Find existing tab
  let tab = Array.from(tabsEl.querySelectorAll('.chat-tab')).find(t => parseInt(t.dataset.convId) === convId)
  if (tab) {
    activateTab(tab)
    return
  }
  // Fetch conversation name
  let name = 'Chat'
  if (db && db.aiConversations) {
    try {
      const row = await db.aiConversations.get(convId)
      if (row && row.name) name = row.name
    } catch (e) {}
  }
  tab = await createTab(name, convId)
  tabsEl.appendChild(tab)
  activateTab(tab)
}

module.exports = { render, createNewTab, openConversation } 