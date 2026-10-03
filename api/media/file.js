import { telegram, BOT_TOKEN } from '../_lib/telegram.js'

// A GET endpoint (so it can be used directly as an <img src>/<video src>),
// deliberately not gated behind initData: file_id values are opaque,
// bot-scoped tokens, not guessable, so "you have the file_id" is an
// acceptable bar here — the bot token itself never reaches the browser.
export default async function handler(req, res) {
  try {
    const fileId = req.query?.file_id
    if (!fileId || typeof fileId !== 'string') return res.status(400).json({ ok: false, error: 'file_id is required.' })

    const file = await telegram('getFile', { file_id: fileId })
    const upstream = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`)
    if (!upstream.ok) throw new Error('Could not fetch file from Telegram.')

    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
    return res.status(200).send(buffer)
  } catch (err) {
    console.error('media/file error:', err?.telegram || err)
    return res.status(404).json({ ok: false, error: err.message })
  }
}
