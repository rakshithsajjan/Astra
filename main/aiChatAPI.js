'use strict'

require('dotenv').config()

const aiChatAPI = (function () {
  const { ipcMain } = require('electron')
  const Groq = require('groq-sdk')

  const API_KEY = process.env.GROQ_API_KEY

  let groq = null

  function initialize () {
    if (!API_KEY) {
      console.warn('[aiChatAPI] GROQ_API_KEY is not set; AI features will be disabled.')
      return
    }

    try {
      groq = new Groq({ apiKey: API_KEY })
    } catch (err) {
      console.error('[aiChatAPI] Failed to initialize Groq SDK:', err)
      groq = null // Ensure groq is null if initialization fails
      return
    }

    // IPC handler for chat messages
    ipcMain.on('ai-chat-send-message', async (event, messages, model) => {
      if (!groq) {
        event.sender.send('ai-chat-error', { error: 'AI service not initialized or API key missing.' })
        return
      }
      try {
        const stream = await groq.chat.completions.create({
          model,
          messages,
          stream: true
        })

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            event.sender.send('ai-chat-chunk', { content })
          }
        }
        event.sender.send('ai-chat-done')
      } catch (err) {
        console.error('[aiChatAPI] Groq API stream request failed:', err)
        event.sender.send('ai-chat-error', { error: err?.message || 'Unknown stream error' })
      }
    })
  }

  return { initialize }
})() 