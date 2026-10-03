import { api } from '../../../telegram/api.js'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const ACCEPT_BY_KIND = {
  photo: 'image/*',
  video: 'video/*',
  animation: 'image/gif,video/mp4',
  audio: 'audio/*',
  voice_note: 'audio/ogg,audio/*',
  document: '*/*'
}

/** Uploads a picked File to the user's own chat via the bot and resolves its Telegram file_id. */
export async function uploadMediaFile(file, kind) {
  const previewUrl = /^(image|video)\//.test(file.type) ? URL.createObjectURL(file) : null
  const base64 = await fileToBase64(file)
  const { file_id } = await api.uploadMedia({ name: file.name, type: file.type, base64 }, kind)
  return { previewUrl, fileId: file_id, name: file.name }
}
