import { telegram, validateInitData } from './_lib/telegram.js'
import { validateBlocks } from './_lib/validateBlocks.js'

// Channels aren't stored server-side anymore (the client keeps its saved
// list in Telegram CloudStorage) — so instead of looking a chat_id up in
// a database, we re-verify the bot's own posting rights in that chat right
// before every send. That's the actual security boundary that matters:
// the bot can only ever post where *it* has admin rights, no matter what
// chat_id a client sends.
async function assertBotCanPost(chatId) {
  const me = await telegram('getMe', {})
  const member = await telegram('getChatMember', { chat_id: chatId, user_id: me.id })
  if (!['administrator', 'creator'].includes(member.status)) {
    throw new Error('The bot is not an admin in that channel anymore.')
  }
  if (member.status === 'administrator' && member.can_post_messages !== true) {
    throw new Error('The bot no longer has permission to post in that channel.')
  }
}

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
      await assertBotCanPost(chatId)
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
