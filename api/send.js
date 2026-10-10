import { telegram, validateInitData } from './_lib/telegram.js'
import { validateBlocks } from './_lib/validateBlocks.js'
import { assertBotCanSend } from './_lib/chatAccess.js'

// Chats aren't stored server-side (the client keeps its saved list in
// Telegram CloudStorage) — so instead of looking a chat_id up in a
// database, we re-verify the bot's own send rights in that chat right
// before every send. That's the actual security boundary that matters:
// the bot can only ever post where it's actually allowed to, no matter
// what chat_id a client sends.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  try {
    const { initData, blocks, target } = req.body || {}
    const user = validateInitData(initData)
    const safeBlocks = validateBlocks(blocks)

    let chatId
    if (!target || target.type === 'private') {
      chatId = user.id
    } else if (target.type === 'channel' && target.chat_id) {
      chatId = target.chat_id
      const me = await telegram('getMe', {})
      const chat = await telegram('getChat', { chat_id: chatId })
      await assertBotCanSend(chat, me)
    } else {
      throw new Error('Unknown send target.')
    }

    const message = await telegram('sendRichMessage', {
      chat_id: chatId,
      rich_message: { blocks: safeBlocks }
    })

    return res.status(200).json({ ok: true, message_id: message.message_id })
  } catch (err) {
    console.error('send error:', err?.telegram || err)
    return res.status(400).json({ ok: false, error: err?.telegram?.description || err.message })
  }
}