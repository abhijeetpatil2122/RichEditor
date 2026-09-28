import { telegram, validateInitData } from '../_lib/telegram.js'
import { saveChannel } from '../_lib/kv.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  try {
    const { initData, channel_id } = req.body || {}
    const user = validateInitData(initData)
    if (!channel_id || typeof channel_id !== 'string') {
      throw new Error('Enter a channel username or ID.')
    }

    const chat = await telegram('getChat', { chat_id: channel_id })
    if (chat.type !== 'channel') throw new Error('That chat is not a channel.')

    const me = await telegram('getMe', {})
    const member = await telegram('getChatMember', { chat_id: chat.id, user_id: me.id })
    if (!['administrator', 'creator'].includes(member.status)) {
      throw new Error('The bot must be an administrator in this channel.')
    }
    if (member.status === 'administrator' && member.can_post_messages !== true) {
      throw new Error('The bot needs the "Post messages" permission in this channel.')
    }

    const channel = { id: chat.id, title: chat.title || 'Untitled channel', username: chat.username || null }
    const channels = await saveChannel(user.id, channel)
    return res.status(200).json({ ok: true, channel, channels })
  } catch (err) {
    console.error('channels/add error:', err?.telegram || err)
    return res.status(400).json({ ok: false, error: err?.telegram?.description || err.message })
  }
}
