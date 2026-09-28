import React from 'react'
import Icon from '../components/Icon.jsx'
import ChannelForm from './ChannelForm.jsx'
import { api } from '../telegram/api.js'
import { haptic, showConfirm } from '../telegram/webApp.js'

export default function SettingsScreen({ user, channels, onChannelsChanged, onClose }) {
  const initial = (user?.first_name || user?.username || '?').charAt(0).toUpperCase()

  async function removeChannel(channel) {
    const ok = await showConfirm(`Remove ${channel.title} from your saved chats?`)
    if (!ok) return
    try {
      await api.removeChannel(channel.id)
      haptic('success')
      onChannelsChanged()
    } catch (err) {
      haptic('error')
      window.alert(err.message)
    }
  }

  return (
    <div className="settings-screen">
      <header className="editor-header">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Back">
          <Icon name="chevron-down" size={20} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <div />
      </header>

      <div className="settings-profile">
        <div className="avatar-large">
          {user?.photo_url ? <img src={user.photo_url} alt="" /> : initial}
        </div>
        <div className="name">
          {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'You'}
        </div>
        <div className="meta">
          {user?.username ? `@${user.username} · ` : ''}ID {user?.id ?? '—'}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Saved chats for posting</div>
        <div className="settings-card">
          {channels.map((ch) => (
            <div className="channel-row" key={ch.id}>
              <div>
                <div className="name">{ch.title}</div>
                {ch.username && <div className="username">@{ch.username}</div>}
              </div>
              <button className="icon-btn delete" type="button" onClick={() => removeChannel(ch)} aria-label="Remove">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
          <ChannelForm onAdded={onChannelsChanged} />
        </div>
      </div>

      <div className="settings-footer-note">
        Rich Message Editor · Bot API 10.x Rich Messages
      </div>
    </div>
  )
}
