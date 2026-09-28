import { kv } from '@vercel/kv'

const key = (userId) => `channels:${userId}`

export async function getChannels(userId) {
  return (await kv.get(key(userId))) || []
}

export async function saveChannel(userId, channel) {
  const list = await getChannels(userId)
  const withoutDup = list.filter((c) => c.id !== channel.id)
  const next = [...withoutDup, channel]
  await kv.set(key(userId), next)
  return next
}

export async function removeChannel(userId, channelId) {
  const list = await getChannels(userId)
  const next = list.filter((c) => c.id !== channelId)
  await kv.set(key(userId), next)
  return next
}

export async function findChannel(userId, channelId) {
  const list = await getChannels(userId)
  return list.find((c) => c.id === channelId) || null
}
