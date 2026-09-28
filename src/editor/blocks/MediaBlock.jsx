import React, { useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useDocument } from '../../store/DocumentContext.jsx'
import { api } from '../../telegram/api.js'
import { haptic } from '../../telegram/webApp.js'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function MediaBlock({ block }) {
  const { setMediaSource, updateBlock } = useDocument()
  const [urlDraft, setUrlDraft] = useState('')
  const [showUrlField, setShowUrlField] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setMediaSource(block.id, { mode: 'upload', previewUrl, fileId: null, status: 'uploading' })

    try {
      const base64 = await fileToBase64(file)
      const { file_id } = await api.uploadMedia({ name: file.name, type: file.type, base64 }, block.kind)
      setMediaSource(block.id, { mode: 'upload', previewUrl, fileId: file_id, status: 'ready' })
      haptic('success')
    } catch (err) {
      setMediaSource(block.id, { mode: 'upload', previewUrl, fileId: null, status: 'error', error: err.message })
      haptic('error')
    }
  }

  function submitUrl() {
    const url = urlDraft.trim()
    if (!url) return
    setMediaSource(block.id, { mode: 'url', url })
    setShowUrlField(false)
    setUrlDraft('')
  }

  if (!block.source) {
    return (
      <div className="media-block">
        <div className="media-placeholder">
          <Icon name={block.kind === 'video' ? 'video' : 'image'} size={28} />
          {showUrlField ? (
            <input
              autoFocus
              className="media-url-input"
              placeholder={`https://…${block.kind === 'video' ? '.mp4' : '.jpg'}`}
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitUrl()}
              onBlur={submitUrl}
            />
          ) : (
            <div className="row">
              <button className="media-mode-btn" type="button" onClick={() => fileInputRef.current?.click()}>
                Upload
              </button>
              <button className="media-mode-btn secondary" type="button" onClick={() => setShowUrlField(true)}>
                Paste URL
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={block.kind === 'video' ? 'video/*' : 'image/*'}
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>
      </div>
    )
  }

  const previewSrc = block.source.mode === 'url' ? block.source.url : block.source.previewUrl

  return (
    <div className="media-block">
      <div className="media-preview">
        {block.kind === 'video' ? (
          <video src={previewSrc} muted playsInline controls={block.source.status !== 'uploading'} />
        ) : (
          <img src={previewSrc} alt="" />
        )}
        {block.source.status === 'uploading' && (
          <div className="upload-overlay">
            <Icon name="spinner" size={16} />
            Uploading…
          </div>
        )}
        {block.source.status === 'error' && (
          <div className="upload-overlay">
            <Icon name="error" size={16} />
            Upload failed — tap to retry
          </div>
        )}
      </div>
      {block.source.status === 'error' && (
        <div className="media-error-banner" onClick={() => fileInputRef.current?.click()} role="button">
          {block.source.error || 'Could not upload media.'} Tap to choose a file again.
        </div>
      )}
      <input
        className="media-caption-input"
        placeholder="Caption (optional)"
        value={block.caption}
        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={block.kind === 'video' ? 'video/*' : 'image/*'}
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}
