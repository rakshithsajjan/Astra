'use strict'

// Simple UI renderer for AI Chat — Phase 2 scaffolding
// Injects static mock messages and an input bar into the #ai-sidebar element.

const aiChatClient = require('aiChatClient.js')
const aiChatTabs = require('aiChatTabs.js')
const aiChatHistory = require('aiChatHistory.js')
const { db } = require('util/database.js')
let convo = []
let initialised = false
let currentConversationId = null

async function render () {
  if (initialised) return
  const sidebar = document.getElementById('ai-sidebar')
  if (!sidebar) {
    console.warn('AI Chat UI: sidebar element not found')
    return
  }

  // Container
  const container = document.createElement('div')
  container.id = 'ai-chat-container'

  // ------- Top toolbar (tabs + history button) -------
  const toolbar = document.createElement('div')
  toolbar.id = 'ai-chat-toolbar'

  // New Chat Tab button (UI-only for now)
  const newTabBtn = document.createElement('button')
  newTabBtn.id = 'ai-chat-newtab-btn'
  newTabBtn.className = 'ai-chat-toolbar-btn'
  newTabBtn.title = 'New conversation'
  newTabBtn.innerHTML = '<span class="i carbon:add"></span>'

  // History button (UI-only for now)
  const historyBtn = document.createElement('button')
  historyBtn.id = 'ai-chat-history-btn'
  historyBtn.className = 'ai-chat-toolbar-btn'
  historyBtn.title = 'Chat history'
  historyBtn.innerHTML = '<span class="i carbon:recently-viewed"></span>'

  toolbar.appendChild(newTabBtn)
  toolbar.appendChild(historyBtn) // buttons at the right side
  container.appendChild(toolbar)

  // Render tabs into toolbar (inserts at the beginning inside render)
  aiChatTabs.render(toolbar)

  // Wire new tab button
  newTabBtn.addEventListener('click', () => {
    aiChatTabs.createNewTab()
  })

  // Listen for conversation switch events
  window.addEventListener('ai-chat-conversation-selected', (e) => {
    switchConversation(e.detail.id)
  })

  // Messages area
  const msgArea = document.createElement('div')
  msgArea.id = 'ai-chat-messages'
  container.appendChild(msgArea)

  // switchConversation will load history and set greeting

  // Input bar
  const inputBar = document.createElement('div')
  inputBar.id = 'ai-chat-input-bar'

  const input = document.createElement('input')
  input.id = 'ai-chat-input'
  input.type = 'text'
  input.placeholder = 'Type a message…'

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendBtn.click()
    }
  })

  const sendBtn = document.createElement('button')
  sendBtn.id = 'ai-chat-send-btn'
  sendBtn.textContent = 'Send'
  sendBtn.addEventListener('click', async () => {
    const text = input.value.trim()
    if (!text) return
    addMessage(msgArea, text, 'user')
    convo.push({ role: 'user', content: text })
    input.value = ''
    input.disabled = true
    sendBtn.disabled = true

    // Create a new message for the streaming response
    const responseMsg = addMessage(msgArea, '', 'assistant')
    const responseTextNode = responseMsg.querySelector('.ai-chat-message-text')

    // Add typing indicator
    const caret = document.createElement('span')
    caret.className = 'typing-caret'
    responseTextNode.appendChild(caret)
    let fullResponse = ''

    aiChatClient.send(convo, {
      onData: (chunk) => {
        caret.remove() // remove caret before adding text
        fullResponse += chunk
        responseTextNode.textContent = fullResponse
        responseTextNode.appendChild(caret) // re-add caret at the end
        msgArea.scrollTop = msgArea.scrollHeight
      },
      onDone: async () => {
        caret.remove()
        convo.push({ role: 'assistant', content: fullResponse })
        // save assistant message
        try {
          await db.aiChat.add({ conversationId: currentConversationId, role: 'assistant', content: fullResponse, timestamp: Date.now() })
        } catch (e) {
          console.error('aiChatUI: failed to save assistant message', e)
        }
        input.disabled = false
        sendBtn.disabled = false
        input.focus()
      },
      onError: (error) => {
        caret.remove()
        responseTextNode.textContent = `Error: ${error}`
        responseMsg.classList.add('error')
        input.disabled = false
        sendBtn.disabled = false
        input.focus()
      }
    })
    // save user message
    try {
      await db.aiChat.add({ conversationId: currentConversationId, role: 'user', content: text, timestamp: Date.now() })
    } catch (e) {
      console.error('aiChatUI: failed to save user message', e)
    }
  })

  historyBtn.addEventListener('click', () => {
    aiChatHistory.toggle(historyBtn)
  })

  inputBar.appendChild(input)
  inputBar.appendChild(sendBtn)
  container.appendChild(inputBar)

  sidebar.appendChild(container)
  initialised = true
}

function addMessage (area, text, role = 'assistant') {
  const msgContainer = document.createElement('div')
  msgContainer.className = `ai-chat-message ${role}`

  // Avatar for assistant
  if (role === 'assistant') {
    const avatar = document.createElement('div')
    avatar.className = 'ai-chat-message-avatar'
    msgContainer.appendChild(avatar)
  }

  // Text container
  const msgText = document.createElement('div')
  msgText.className = 'ai-chat-message-text'
  msgText.textContent = text
  msgContainer.appendChild(msgText)

  area.appendChild(msgContainer)
  area.scrollTop = area.scrollHeight
  return msgContainer // Return the new element
}

function clearMessages (area) {
  while (area.firstChild) area.firstChild.remove()
  convo = []
}

async function switchConversation (convId) {
  if (currentConversationId === convId) return
  currentConversationId = convId
  const area = document.getElementById('ai-chat-messages')
  if (!area) return
  clearMessages(area)
  await loadHistory(area, convId)
  if (convo.length === 0) {
    addMessage(area, 'Hi! I\'m your AI assistant. How can I help?', 'assistant')
  }
}

async function loadHistory (area, convId) {
  if (!db || !db.aiChat) return
  try {
    const history = await db.aiChat.where('conversationId').equals(convId).sortBy('timestamp')
    history.forEach(row => {
      addMessage(area, row.content, row.role)
      convo.push({ role: row.role, content: row.content })
    })
  } catch (e) {
    console.error('aiChatUI: failed to load history', e)
  }
}

module.exports = { render } 