'use strict'

// Simple UI renderer for AI Chat — Phase 2 scaffolding
// Injects static mock messages and an input bar into the #ai-sidebar element.

const aiChatClient = require('aiChatClient.js')
let convo = []
let initialised = false

function render () {
  if (initialised) return
  const sidebar = document.getElementById('ai-sidebar')
  if (!sidebar) {
    console.warn('AI Chat UI: sidebar element not found')
    return
  }

  // Container
  const container = document.createElement('div')
  container.id = 'ai-chat-container'

  // Messages area
  const msgArea = document.createElement('div')
  msgArea.id = 'ai-chat-messages'
  container.appendChild(msgArea)

  // Inject some mock messages
  addMessage(msgArea, 'Hi! I\'m your AI assistant. How can I help?', 'assistant')

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
      onDone: () => {
        caret.remove()
        convo.push({ role: 'assistant', content: fullResponse })
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

module.exports = { render } 