import { getInitData } from './webApp.js'

async function call(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initData: getInitData(), ...body })
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
  listChannels: () => call('/api/channels/list', {}),
  addChannel: (channelId) => call('/api/channels/add', { channel_id: channelId }),
  removeChannel: (channelId) => call('/api/channels/remove', { channel_id: channelId }),

  /** file: { name, type, base64 } */
  uploadMedia: (file, kind) => call('/api/media/upload', { file, kind }),

  /** target: { type: 'private' } | { type: 'channel', chat_id } */
  sendRichMessage: (blocks, target) => call('/api/send', { blocks, target })
}

/** URL for displaying an already-uploaded file inside the editor preview. */
export function mediaFileUrl(fileId) {
  return `/api/media/file?file_id=${encodeURIComponent(fileId)}`
}
