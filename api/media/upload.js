import { telegramUpload, validateInitData } from '../_lib/telegram.js'

const MAX_BYTES = 20 * 1024 * 1024 // Bot API's own upload limit

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  try {
    const { initData, file, kind } = req.body || {}
    const user = validateInitData(initData)
    if (!file?.base64) throw new Error('No file provided.')

    const buffer = Buffer.from(file.base64, 'base64')
    if (buffer.length > MAX_BYTES) throw new Error('File is too large (20 MB limit).')

    const method = kind === 'video' ? 'sendVideo' : 'sendPhoto'
    const field = kind === 'video' ? 'video' : 'photo'

    // Sending it to the user's own chat with the bot both gets us a usable
    // file_id *and* doubles as an instant "here's what you uploaded" receipt.
    const message = await telegramUpload(method, {
      chat_id: user.id,
      [field]: { buffer, filename: file.name || field, contentType: file.type }
    })

    const fileId =
      kind === 'video' ? message.video?.file_id : message.photo?.[message.photo.length - 1]?.file_id

    if (!fileId) throw new Error('Telegram did not return a file reference.')
    return res.status(200).json({ ok: true, file_id: fileId, message_id: message.message_id })
  } catch (err) {
    console.error('media/upload error:', err?.telegram || err)
    return res.status(400).json({ ok: false, error: err?.telegram?.description || err.message })
  }
}
