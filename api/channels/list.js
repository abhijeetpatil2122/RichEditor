import { validateInitData } from '../_lib/telegram.js'
import { getChannels } from '../_lib/kv.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  try {
    const user = validateInitData(req.body?.initData)
    const channels = await getChannels(user.id)
    return res.status(200).json({ ok: true, channels })
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message })
  }
}
