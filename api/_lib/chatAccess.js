import { telegram } from './telegram.js'

export const SUPPORTED_CHAT_TYPES = new Set(['channel', 'group', 'supergroup'])

/** Checks the bot can actually send messages in this chat. Throws if not. */
export async function assertBotCanSend(chat, me) {
  const member = await telegram('getChatMember', { chat_id: chat.id, user_id: me.id })

  if (chat.type === 'channel') {
    // Only admins can post in channels at all.
    if (!['administrator', 'creator'].includes(member.status)) {
      throw new Error('The bot must be an administrator in this channel.')
    }
    if (member.status === 'administrator' && member.can_post_messages !== true) {
      throw new Error('The bot needs the "Post messages" permission in this channel.')
    }
    return
  }

  // Group / supergroup: ordinary members (not just admins) can send
  // messages by default — just make sure the bot is actually in the chat
  // and hasn't been specifically restricted from sending.
  if (!['member', 'administrator', 'creator'].includes(member.status)) {
    throw new Error('The bot must be a member of this group.')
  }
  if (member.status === 'member' && member.can_send_messages === false) {
    throw new Error('The bot is restricted from sending messages in this group.')
  }
}
