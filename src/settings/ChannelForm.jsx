import React, { useState } from 'react'
import { api } from '../telegram/api.js'
import { saveChannel } from '../telegram/channelStorage.js'
import { haptic } from '../telegram/webApp.js'

export default function ChannelForm({ onAdded }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    const id = value.trim()
    if (!id) return
    setBusy(true)
    setError('')
    try {
      const { channel } = await api.verifyChannel(id)
      await saveChannel(channel)
      haptic('success')
      setValue('')
      onAdded()
    } catch (err) {
      haptic('error')
      setError(err.message || 'Could not verify that channel.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="channel-form">
      <input
        placeholder="@channelusername or -100123456789"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <div className="form-error">{error}</div>}
      <button className="add-btn" type="button" onClick={submit} disabled={busy || !value.trim()}>
        {busy ? 'Verifying…' : 'Add channel'}
      </button>
      <div className="hint">
        Add the bot as an admin in the channel first, with permission to post messages — then add it here to verify.
      </div>
    </div>
  )
}
