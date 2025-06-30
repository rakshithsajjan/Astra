const webviews = require('webviews.js')
const settings = require('util/settings/settings.js')
const aiChatUI = require('aiChatUI.js')

const DEFAULT_WIDTH = 320
const MIN_WIDTH = 270

let sidebarWidth = settings.get('aiSidebarWidth') || DEFAULT_WIDTH

let sidebarEl
let isOpen = false
let handleEl

function createSidebar () {
  sidebarEl = document.createElement('div')
  sidebarEl.id = 'ai-sidebar'
  sidebarEl.style.width = sidebarWidth + 'px'
  sidebarEl.hidden = true

  // resize handle
  handleEl = document.createElement('div')
  handleEl.id = 'ai-sidebar-resize-handle'
  sidebarEl.appendChild(handleEl)

  let dragActive = false
  let startX = 0
  let startWidth = sidebarWidth

  handleEl.addEventListener('mousedown', (e) => {
    dragActive = true
    startX = e.clientX
    startWidth = sidebarWidth
    e.preventDefault()
    document.body.classList.add('ai-sidebar-resizing')
  })

  window.addEventListener('mousemove', (e) => {
    if (!dragActive) return
    const delta = startX - e.clientX // dragging left increases width
    let newWidth = startWidth + delta
    const maxWidth = Math.floor(window.innerWidth / 2)
    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH
    if (newWidth > maxWidth) newWidth = maxWidth
    resizeTo(newWidth)
  })

  window.addEventListener('mouseup', () => {
    if (dragActive) {
      dragActive = false
      settings.set('aiSidebarWidth', sidebarWidth)
      document.body.classList.remove('ai-sidebar-resizing')
    }
  })

  document.body.appendChild(sidebarEl)
}

function resizeTo (newWidth) {
  if (newWidth === sidebarWidth) return
  const delta = newWidth - sidebarWidth
  sidebarWidth = newWidth
  sidebarEl.style.width = sidebarWidth + 'px'
  // adjust webview margin inversely
  webviews.adjustMargin([0, delta, 0, 0])
}

function open () {
  if (isOpen) return
  isOpen = true

  sidebarEl.hidden = false
  document.body.classList.add('ai-sidebar-open')

  // shift content immediately
  webviews.adjustMargin([0, sidebarWidth, 0, 0])

  // lazily render chat UI on first open
  aiChatUI.render()

  // set focus on the input, but wait a moment for the animation
  setTimeout(() => {
    const input = document.getElementById('ai-chat-input')
    if (input) {
      input.focus()
    }
  }, 180)
}

function close () {
  if (!isOpen) return
  isOpen = false

  document.body.classList.remove('ai-sidebar-open')

  // reset margin instantly
  webviews.adjustMargin([0, -sidebarWidth, 0, 0])

  // delay hiding sidebar until transform completes (~160ms)
  setTimeout(() => {
    if (!isOpen) sidebarEl.hidden = true
  }, 180)
}

function toggle () {
  if (isOpen) {
    close()
  } else {
    open()
  }
}

function initialize () {
  createSidebar()
}

module.exports = { initialize, toggle, open, close, resizeTo } 