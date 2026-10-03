import { telegramUpload, validateInitData } from '../_lib/telegram.js'

const MAX_BYTES = 20 * 1024 * 1024 // Bot API's own upload limit

// Maps our block "kind" to the Bot API method/field used to upload it via
// the user's own chat, and how to read the resulting file_id back out.
const UPLOAD_SPEC = {
  photo: { method: 'sendPhoto', field: 'photo', readFileId: (m) => m.photo?.[m.photo.length - 1]?.file_id },
  video: { method: 'sendVideo', field: 'video', readFileId: (m) => m.video?.file_id },
  animation: { method: 'sendAnimation', field: 'animation', readFileId: (m) => m.animation?.file_id },
  audio: { method: 'sendAudio', field: 'audio', readFileId: (m) => m.audio?.file_id },
  document: { method: 'sendDocument', field: 'document', readFileId: (m) => m.document?.file_id },
  voice_note: { method: 'sendVoice', field: 'voice', readFileId: (m) => m.voice?.file_id }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  try {
    const { initData, file, kind } = req.body || {}
    const user = validateInitData(initData)
    if (!file?.base64) throw new Error('No file provided.')
    const spec = UPLOAD_SPEC[kind]
    if (!spec) throw new Error(`Unsupported media kind: ${kind}`)

    const buffer = Buffer.from(file.base64, 'base64')
    if (buffer.length > MAX_BYTES) throw new Error('File is too large (20 MB limit).')

    const message = await telegramUpload(spec.method, {
      chat_id: user.id,
      [spec.field]: { buffer, filename: file.name || spec.field, contentType: file.type }
    })

    const fileId = spec.readFileId(message)
    if (!fileId) throw new Error('Telegram did not return a file reference.')
    return res.status(200).json({ ok: true, file_id: fileId, message_id: message.message_id })
  } catch (err) {
    console.error('media/upload error:', err?.telegram || err)
    return res.status(400).json({ ok: false, error: err?.telegram?.description || err.message })
  }
}
