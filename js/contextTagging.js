'use strict'

/* Autocomplete popover listing open tabs when user types "@" in chat input */

console.log('contextTagging.js module loaded')

const TAB_POPOVER_ID = 'tab-mention-popover'
let popoverEl
let currentIndex = 0
let tabList = []
let activeInput = null

function open (anchorInput) {
  console.log('contextTagging.open called with:', anchorInput)
  if (popoverEl && popoverEl.isConnected) return

  activeInput = anchorInput
  tabList = Array.from(tabs.get()).map(t => ({ id: t.id, title: t.title || t.url }))
  if (tabList.length === 0) {
    console.log('No tabs found, returning')
    return
  }

  popoverEl = document.createElement('div')
  popoverEl.id = TAB_POPOVER_ID
  currentIndex = 0

  tabList.forEach((item, index) => {
    const el = document.createElement('div')
    el.className = 'tab-mention-item'
    el.textContent = item.title
    el.dataset.tabId = item.id
    el.addEventListener('click', () => {
      handleSelection()
    })
    popoverEl.appendChild(el)
  })

  setActive(currentIndex)
  document.body.appendChild(popoverEl)
  positionPopover(anchorInput)
  adjustContrast()

  window.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeyEvents, true)
}

function handleSelection () {
  try {
    if (tabList[currentIndex] && activeInput) {
      insertMention(activeInput, tabList[currentIndex])
    }
  } catch (e) {
    console.error('[contextTagging] Error during mention insertion:', e)
  } finally {
    // Always close the popover, even if insertion fails
    close()
  }
}

function positionPopover (input) {
  const rect = input.getBoundingClientRect()
  popoverEl.style.position = 'fixed'
  popoverEl.style.left = rect.left + 'px'
  popoverEl.style.bottom = (window.innerHeight - rect.top + 4) + 'px' // appear above input
}

function close () {
  if (popoverEl) {
    popoverEl.remove()
    document.removeEventListener('keydown', handleKeyEvents, true)
    window.removeEventListener('click', handleOutsideClick)
    popoverEl = null
    tabList = []
    activeInput = null
  }
}

function handleOutsideClick (e) {
  if (popoverEl && !popoverEl.contains(e.target)) {
    close()
  }
}

function handleKeyEvents (e) {
  if (!popoverEl) return

  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    close()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopPropagation()
    currentIndex = (currentIndex - 1 + tabList.length) % tabList.length
    setActive(currentIndex)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    currentIndex = (currentIndex + 1) % tabList.length
    setActive(currentIndex)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    handleSelection()
  }
}

function setActive (idx) {
  const items = Array.from(popoverEl.querySelectorAll('.tab-mention-item'))
  items.forEach(i => i.classList.remove('active'))
  if (items[idx]) {
    items[idx].classList.add('active')
    items[idx].scrollIntoView({ block: 'nearest' })
  }
  // ensure caret remains inside input after insertion
  activeInput.focus()
}

function adjustContrast () {
  const bg = window.getComputedStyle(popoverEl).backgroundColor
  if (!bg) return
  const rgb = bg.match(/\d+/g).map(Number)
  const luminance = (0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2]) / 255
  if (luminance < 0.4) {
    popoverEl.classList.add('dark-bg')
  }
}

function insertMention (input, item) {
  // Ensure input has focus first; the selection may still point to the pop-over
  input.focus()

  const performInsertion = () => {
    let sel = window.getSelection()

    if (!sel || sel.rangeCount === 0 || !input.contains(sel.anchorNode)) {
      // No valid selection inside input – place caret at the end
      sel = window.getSelection()
      const rangeToEnd = document.createRange()
      rangeToEnd.selectNodeContents(input)
      rangeToEnd.collapse(false)
      sel.removeAllRanges()
      sel.addRange(rangeToEnd)
    }

    const mentionNode = document.createElement('span')
    mentionNode.className = 'mention'
    mentionNode.contentEditable = 'false'
    mentionNode.innerText = `@${item.title}`

    const spaceNode = document.createTextNode(' ')

    const range = sel.getRangeAt(0)

    // Remove the preceding "@" if it's right before the caret
    if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
      const textNode = range.startContainer
      if (textNode.textContent[range.startOffset - 1] === '@') {
        textNode.deleteData(range.startOffset - 1, 1)
        range.setStart(textNode, range.startOffset - 1)
        range.collapse(true)
      }
    }

    range.deleteContents()
    range.insertNode(mentionNode)
    range.insertNode(spaceNode)

    // Move caret after space
    range.setStartAfter(spaceNode)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    console.log('[contextTagging] Mention inserted:', mentionNode.innerText)

    // keep focus in input
    input.focus()
  }

  // If the caret still sits outside the input, defer insertion one frame
  if (!input.contains(window.getSelection().anchorNode)) {
    requestAnimationFrame(performInsertion)
  } else {
    performInsertion()
  }
}

module.exports = { open, close } 