import React from 'react'
import Icon from '../components/Icon.jsx'
import ChannelForm from './ChannelForm.jsx'
import { removeChannel as removeChannelFromStorage } from '../telegram/channelStorage.js'
import { mediaFileUrl } from '../telegram/api.js'
import { haptic, showConfirm } from '../telegram/webApp.js'

// No header here on purpose — Telegram's own BackButton (wired up in
// App.jsx) is what navigates back to the editor on this screen.
export default function SettingsScreen({ user, channels, onChannelsChanged }) {
  const initial = (user?.first_name || user?.username || '?').charAt(0).toUpperCase()

  async function removeChannel(channel) {
    const ok = await showConfirm(`Remove ${channel.title} from your saved chats?`)
    if (!ok) return
    try {
      await removeChannelFromStorage(channel.id)
      haptic('success')
      onChannelsChanged()
    } catch (err) {
      haptic('error')
      window.alert(err.message)
    }
  }

  return (
    <div className="settings-screen">
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
              <div className="channel-avatar">
                {ch.photoFileId ? <img src={mediaFileUrl(ch.photoFileId)} alt="" /> : ch.title?.charAt(0)?.toUpperCase() || '#'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
