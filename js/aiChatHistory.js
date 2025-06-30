'use strict'

const { db } = require('util/database.js')
const aiChatTabs = require('aiChatTabs.js')

let popoverEl

function toggle (anchorBtn) {
  if (popoverEl && popoverEl.isConnected) {
    close()
  } else {
    open(anchorBtn)
  }
}

async function open (anchorBtn) {
  if (!db || !db.aiConversations) {
    console.warn('aiChatHistory: db not ready')
    return
  }
  const list = await db.aiConversations.orderBy('lastActive').reverse().toArray()
  if (list.length === 0) return

  popoverEl = document.createElement('div')
  popoverEl.id = 'ai-chat-history-popover'

  list.forEach(row => {
    const item = document.createElement('div')
    item.className = 'history-item'
    item.textContent = row.name || 'Chat'
    item.addEventListener('click', () => {
      aiChatTabs.openConversation(row.id)
      close()
    })
    popoverEl.appendChild(item)
  })

  document.body.appendChild(popoverEl)
  // position under anchorBtn
  const rect = anchorBtn.getBoundingClientRect()
  popoverEl.style.top = rect.bottom + 'px'
  popoverEl.style.right = (window.innerWidth - rect.right) + 'px'
}

function close () {
  if (popoverEl) popoverEl.remove()
}

module.exports = { toggle, close } 