import { telegram, validateInitData } from '../_lib/telegram.js'
import { assertBotCanSend, SUPPORTED_CHAT_TYPES } from '../_lib/chatAccess.js'

// Verification only — nothing is persisted here. The Mini App saves the
// verified chat into its own Telegram CloudStorage after this returns.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  try {
    const { initData, channel_id } = req.body || {}
    validateInitData(initData) // just needs to be a real Telegram user; result unused here
    if (!channel_id || typeof channel_id !== 'string') throw new Error('Enter a username or chat ID.')

    const chat = await telegram('getChat', { chat_id: channel_id })
    if (!SUPPORTED_CHAT_TYPES.has(chat.type)) {
      throw new Error('That has to be a channel, group, or supergroup — not a private chat.')
    }

    const me = await telegram('getMe', {})
    await assertBotCanSend(chat, me)

    const channel = {
      id: chat.id,
      title: chat.title || 'Untitled chat',
      username: chat.username || null,
      type: chat.type, // 'channel' | 'group' | 'supergroup' — shown in the UI
      // getChat (unlike the Chat embedded in a Message) includes the
      // chat's photo — small_file_id works directly with our
      // /api/media/file.js proxy, same as any other file_id.
      photoFileId: chat.photo?.small_file_id || null
    }
    return res.status(200).json({ ok: true, channel })
  } catch (err) {
    console.error('channels/verify error:', err?.telegram || err)
    return res.status(400).json({ ok: false, error: err?.telegram?.description || err.message })
  }
}
