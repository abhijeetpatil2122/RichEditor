import crypto from 'node:crypto'

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/** Calls https://api.telegram.org/bot<token>/<method> and throws on ok:false. */
export async function telegram(method, body) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured.')
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!data.ok) {
    const err = new Error(data.description || `Telegram ${method} failed.`)
    err.telegram = data
    throw err
  }
  return data.result
}

/**
 * Like `telegram()` but for methods that need multipart/form-data (file
 * uploads). `fields` is a plain object; any value shaped like
 * { buffer, filename, contentType } is sent as the file part.
 */
export async function telegramUpload(method, fields) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured.')
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === 'object' && value.buffer) {
      form.append(key, new Blob([value.buffer], { type: value.contentType || 'application/octet-stream' }), value.filename || key)
    } else if (value !== undefined && value !== null) {
      form.append(key, String(value))
    }
  }
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: 'POST', body: form })
  const data = await res.json()
  if (!data.ok) {
    const err = new Error(data.description || `Telegram ${method} failed.`)
    err.telegram = data
    throw err
  }
  return data.result
}

/**
 * Verifies the `initData` string Telegram gives the Mini App and returns
 * the authenticated user. See:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(raw) {
  if (!raw || !BOT_TOKEN) throw new Error('Telegram authorization data is missing.')

  const params = new URLSearchParams(raw)
  const hash = params.get('hash')
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) throw new Error('Invalid Telegram initData.')
  params.delete('hash')

  const pairs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  const checkString = pairs.map(([k, v]) => `${k}=${v}`).join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
  const expected = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid Telegram initData signature.')
  }

  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate) || Math.abs(Date.now() / 1000 - authDate) > 86400) {
    throw new Error('Telegram initData has expired — reopen the Mini App.')
  }

  let user
  try {
    user = JSON.parse(params.get('user') || 'null')
  } catch {
    throw new Error('Invalid Telegram user payload.')
  }
  if (!user?.id) throw new Error('Telegram user is missing from initData.')
  return user
}

/** True if the webhook request actually came from Telegram (checks the secret header). */
export function isWebhookAuthentic(req) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) return true // no secret configured — allow, but you should set one in production
  return req.headers['x-telegram-bot-api-secret-token'] === secret
}