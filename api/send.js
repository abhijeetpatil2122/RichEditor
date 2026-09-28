import { telegram, validateInitData } from './telegram.js'
import { validateBlocks } from '../_lib/validateBlocks.js'
import { findChannel } from '../_lib/kv.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  try {
    const { initData, blocks, target } = req.body || {}
    const user = validateInitData(initData)
    const safeBlocks = validateBlocks(blocks)

    let chatId
    if (!target || target.type === 'private') {
      chatId = user.id
    } else if (target.type === 'channel') {
      // Only ever send to a channel this user has verified & saved —
      // never trust a chat_id the client sends on its own.
      const channel = await findChannel(user.id, target.chat_id)
      if (!channel) throw new Error('That channel is not in your saved list. Add it again in Settings.')
      chatId = channel.id
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
