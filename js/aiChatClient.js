'use strict'

const { ipcRenderer } = require('electron')

// Removed direct Groq SDK import and initialization

/**
 * Send a chat completion request via IPC to the main process and stream the response.
 * @param {Array<{role:'user'|'assistant'|'system',content:string}>} messages
 * @param {object} callbacks - An object containing onData, onDone, and onError callbacks.
 * @param {string} [model]
 */
function send (messages, { onData, onDone, onError }, model = 'meta-llama/llama-4-scout-17b-16e-instruct') {
  // Set up listeners for the response
  const chunkListener = (event, { content }) => onData(content)
  const doneListener = () => {
    cleanup()
    onDone()
  }
  const errorListener = (event, { error }) => {
    cleanup()
    onError(error)
  }

  ipcRenderer.on('ai-chat-chunk', chunkListener)
  ipcRenderer.on('ai-chat-done', doneListener)
  ipcRenderer.on('ai-chat-error', errorListener)

  function cleanup () {
    ipcRenderer.removeListener('ai-chat-chunk', chunkListener)
    ipcRenderer.removeListener('ai-chat-done', doneListener)
    ipcRenderer.removeListener('ai-chat-error', errorListener)
  }

  // Send the request to the main process
  ipcRenderer.send('ai-chat-send-message', messages, model)

  // Return a cleanup function in case the caller wants to abort
  return cleanup
}

module.exports = { send } 