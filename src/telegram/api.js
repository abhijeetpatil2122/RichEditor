import { getInitData } from './webApp.js'

async function call(path, body, { signal } = {}) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initData: getInitData(), ...body }),
    signal
  })
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Server returned an invalid response.')
  }
  if (!res.ok || !data.ok) {
    throw new Error(data?.error || 'Request failed.')
  }
  return data
}

export const api = {
  /** Verifies the bot is an admin (with post rights) in the channel — does not save it. */
  verifyChannel: (channelId) => call('/api/channels/verify', { channel_id: channelId }),

  /** file: { name, type, base64 }. Pass `signal` (AbortController.signal) so uploads can be cancelled. */
  uploadMedia: (file, kind, signal) => call('/api/media/upload', { file, kind }, { signal }),

  /** target: { type: 'private' } | { type: 'channel', chat_id } */
  sendRichMessage: (blocks, target) => call('/api/send', { blocks, target })
}

/** URL for displaying an already-uploaded file (or a channel's photo file_id) inside the editor. */
export function mediaFileUrl(fileId) {
  if (!fileId) return null
  return `/api/media/file?file_id=${encodeURIComponent(fileId)}`
}
