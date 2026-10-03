import React, { useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useDocument } from '../../store/DocumentContext.jsx'
import { createMediaItem } from '../../document/schema.js'
import { uploadMediaFile } from './shared/useMediaUpload.js'

function Item({ item, onPick, onRemove }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const kind = file.type.startsWith('video/') ? 'video' : 'photo'
      const { previewUrl, fileId } = await uploadMediaFile(file, kind)
      onPick({ kind, source: { mode: 'upload', previewUrl, fileId, status: 'ready' } })
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!item.source) {
    return (
      <button type="button" className="multi-media-add" onClick={() => inputRef.current?.click()}>
        {busy ? <Icon name="spinner" size={16} /> : <Icon name="plus" size={18} />}
        <input ref={inputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} />
      </button>
    )
  }

  const src = item.source.mode === 'url' ? item.source.url : item.source.previewUrl
  return (
    <div className="multi-media-item">
      {item.kind === 'video' ? <video src={src} muted playsInline /> : <img src={src} alt="" />}
      <button type="button" className="remove" onClick={onRemove} aria-label="Remove">
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}

export default function MultiMediaBlock({ block }) {
  const { updateBlock } = useDocument()

  function updateItem(id, patch) {
    updateBlock(block.id, { items: block.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  }

  function removeItem(id) {
    const items = block.items.filter((i) => i.id !== id)
    updateBlock(block.id, { items: items.length ? items : [createMediaItem('photo')] })
  }

  function addSlot() {
    updateBlock(block.id, { items: [...block.items, createMediaItem('photo')] })
  }

  const filled = block.items.filter((i) => i.source)
  const showAddSlot = block.items.length < 10 && filled.length === block.items.length

  return (
    <div className="multi-media-block">
      <div className="multi-media-grid">
        {block.items.map((item) => (
          <Item key={item.id} item={item} onPick={(patch) => updateItem(item.id, patch)} onRemove={() => removeItem(item.id)} />
        ))}
        {showAddSlot && (
          <button type="button" className="multi-media-add" onClick={addSlot}>
            <Icon name="plus" size={18} />
          </button>
        )}
      </div>
      <input
        className="media-caption-input"
        placeholder="Caption for the whole set (optional)"
        value={block.caption}
        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
      />
    </div>
  )
}
