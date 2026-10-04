import { telegram, isWebhookAuthentic } from './_lib/telegram.js'
import { getCommandMessage } from './_lib/botMessages.js'

const KNOWN_COMMANDS = new Set(['start', 'help', 'howtouse', 'about'])

async function handleMessage(message) {
  const text = typeof message.text === 'string' ? message.text.trim() : ''
  if (message.chat?.type !== 'private' || !text.startsWith('/')) return

  const command = text.split(/\s+/)[0].slice(1).split('@')[0].toLowerCase()
  if (!KNOWN_COMMANDS.has(command)) return

  const reply = getCommandMessage(command)
  if (!reply) return

  await telegram('sendRichMessage', {
    chat_id: message.chat.id,
    rich_message: { blocks: reply.blocks },
    ...(reply.reply_markup ? { reply_markup: reply.reply_markup } : {})
  })
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
