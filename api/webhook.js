import { telegram, isWebhookAuthentic } from './_lib/telegram.js'

const APP_URL = process.env.APP_URL || ''

async function handleMessage(message) {
  const text = typeof message.text === 'string' ? message.text.trim() : ''
  if (message.chat?.type !== 'private' || !text.startsWith('/')) return

  const command = text.split(/\s+/)[0].split('@')[0].toLowerCase()
  if (command === '/start') {
    await telegram('sendMessage', {
      chat_id: message.chat.id,
      text: '👋 Open the editor to build a Rich Message and post it to your channel.',
      reply_markup: {
        inline_keyboard: [[{ text: '✏️ Open editor', web_app: { url: APP_URL } }]]
      }
    })
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'rich-message-editor-bot' })
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  if (!isWebhookAuthentic(req)) return res.status(401).json({ ok: false, error: 'Unauthorized.' })

  try {
    const update = req.body || {}
    if (update.message) await handleMessage(update.message)
    // Always 200 to Telegram even if we ignored the update, so it doesn't retry forever.
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err?.telegram || err)
    return res.status(200).json({ ok: true })
  }
}
