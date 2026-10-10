import React, { useEffect, useState } from 'react'
import BottomSheet from '../../../components/BottomSheet.jsx'
import Icon from '../../../components/Icon.jsx'
import { BUTTON_STYLES, BUTTON_ACTION_TYPES } from '../../../document/schema.js'

const DEST_LABEL = {
  url: 'URL',
  web_app: 'Mini App URL',
  callback: 'Callback data'
}
const DEST_PLACEHOLDER = {
  url: 'https://example.com',
  web_app: 'https://your-app.vercel.app/...',
  callback: 'an identifier your bot reads back'
}

/**
 * Controlled by `open` + `initial` (a button config, or null to start
 * blank). Calling `onSave` with the finished config is the only way this
 * component reports back — it doesn't touch document state itself, so the
 * same sheet works for both the inline mark and the Buttons block.
 */
export default function ButtonEditorSheet({ open, initial, onClose, onSave }) {
  const [text, setText] = useState('')
  const [style, setStyle] = useState('primary')
  const [actionType, setActionType] = useState('url')
  const [dest, setDest] = useState('')

  useEffect(() => {
    if (!open) return
    setText(initial?.text || '')
    setStyle(initial?.style || 'primary')
    setActionType(initial?.actionType || 'url')
    setDest(initial?.dest || '')
  }, [open, initial])

  function save() {
    if (!text.trim() || !dest.trim()) return
    onSave({ text: text.trim(), style, actionType, dest: dest.trim() })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Button">
      <div className="button-editor">
        <label>Label</label>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Button text" maxLength={64} />

        <label>Style</label>
        <div className="pill-row">
          {BUTTON_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              className={`style-pill ${s} ${style === s ? 'active' : ''}`}
              disabled={s === 'link' && actionType !== 'callback'}
              onClick={() => setStyle(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <label>Action</label>
        <div className="pill-row">
          {BUTTON_ACTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`action-pill ${actionType === t ? 'active' : ''}`}
              onClick={() => {
                setActionType(t)
                if (t !== 'callback' && style === 'link') setStyle('primary')
              }}
            >
              <Icon name={`action-${t}`} size={14} />
              {t === 'web_app' ? 'Mini App' : t}
            </button>
          ))}
        </div>

        <label>{DEST_LABEL[actionType]}</label>
        <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder={DEST_PLACEHOLDER[actionType]} />

        <button type="button" className="add-btn" style={{ marginTop: 4 }} disabled={!text.trim() || !dest.trim()} onClick={save}>
          Save button
        </button>
      </div>
    </BottomSheet>
  )
}
