import React, { useEffect, useState, useCallback } from 'react'
import EditorScreen from './editor/EditorScreen.jsx'
import SettingsScreen from './settings/SettingsScreen.jsx'
import { DocumentProvider } from './store/DocumentContext.jsx'
import { initWebApp, getTelegramUser, configureBackButton, setBackButtonVisible } from './telegram/webApp.js'
import { api } from './telegram/api.js'

export default function App() {
  const [screen, setScreen] = useState('editor') // 'editor' | 'settings'
  const [user, setUser] = useState(null)
  const [channels, setChannels] = useState([])

  useEffect(() => {
    initWebApp()
    setUser(getTelegramUser())
    api
      .listChannels()
      .then((r) => setChannels(r.channels || []))
      .catch(() => {})
  }, [])

  const openSettings = useCallback(() => setScreen('settings'), [])
  const closeSettings = useCallback(() => setScreen('editor'), [])

  useEffect(() => {
    setBackButtonVisible(screen === 'settings')
    const cleanup = configureBackButton({ onClick: closeSettings })
    return cleanup
  }, [screen, closeSettings])

  const refreshChannels = useCallback(() => {
    api
      .listChannels()
      .then((r) => setChannels(r.channels || []))
      .catch(() => {})
  }, [])

  return (
    <DocumentProvider>
      {screen === 'editor' ? (
        <EditorScreen user={user} channels={channels} onOpenSettings={openSettings} />
      ) : (
        <SettingsScreen user={user} channels={channels} onChannelsChanged={refreshChannels} onClose={closeSettings} />
      )}
    </DocumentProvider>
  )
}
