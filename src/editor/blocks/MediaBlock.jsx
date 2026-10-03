import React, { useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useDocument } from '../../store/DocumentContext.jsx'
import { ACCEPT_BY_KIND, uploadMediaFile } from './shared/useMediaUpload.js'

const KIND_ICON = { photo: 'image', video: 'video', animation: 'animation', audio: 'audio', document: 'document', voice_note: 'voice_note' }
const KIND_LABEL = { photo: 'photo', video: 'video', animation: 'GIF', audio: 'audio file', document: 'file', voice_note: 'voice note' }
const URL_EXAMPLE = { photo: 'https://…jpg', video: 'https://…mp4', animation: 'https://…gif', audio: 'https://…mp3', document: 'https://…pdf', voice_note: 'https://…ogg' }

export default function MediaBlock({ block }) {
  const { setMediaSource, updateBlock } = useDocument()
  const [urlDraft, setUrlDraft] = useState('')
  const [showUrlField, setShowUrlField] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setMediaSource(block.id, { mode: 'upload', previewUrl: null, fileId: null, status: 'uploading', name: file.name })
    try {
      const { previewUrl, fileId, name } = await uploadMediaFile(file, block.kind)
      setMediaSource(block.id, { mode: 'upload', previewUrl, fileId, status: 'ready', name })
    } catch (err) {
      setMediaSource(block.id, { mode: 'upload', previewUrl: null, fileId: null, status: 'error', error: err.message })
    }
  }

  function submitUrl() {
    const url = urlDraft.trim()
    if (!url) return
    setMediaSource(block.id, { mode: 'url', url })
    setShowUrlField(false)
    setUrlDraft('')
  }

  function reset() {
    setMediaSource(block.id, null)
    setShowUrlField(false)
    setUrlDraft('')
  }

  if (!block.source) {
    return (
      <div className="media-block">
        <div className="media-placeholder">
          <Icon name={KIND_ICON[block.kind] || 'document'} size={26} />
          {showUrlField ? (
            <input
              autoFocus
              className="media-url-input"
              placeholder={URL_EXAMPLE[block.kind] || 'https://…'}
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
            accept={ACCEPT_BY_KIND[block.kind] || '*/*'}
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>
      </div>
    )
  }

  const isPreviewable = block.kind === 'photo' || block.kind === 'video' || block.kind === 'animation'
  const previewSrc = block.source.mode === 'url' ? block.source.url : block.source.previewUrl

  return (
    <div className="media-block">
      {isPreviewable && previewSrc ? (
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
        </div>
      ) : (
        <div className="media-placeholder" style={{ padding: '18px 16px' }}>
          <Icon name={KIND_ICON[block.kind] || 'document'} size={22} />
          <span style={{ fontSize: 13 }}>
            {block.source.status === 'uploading'
              ? `Uploading ${KIND_LABEL[block.kind]}…`
              : block.source.name || (block.source.mode === 'url' ? block.source.url : `${KIND_LABEL[block.kind]} attached`)}
          </span>
        </div>
      )}

      {block.source.status === 'error' && (
        <div className="media-error-banner" onClick={() => fileInputRef.current?.click()} role="button">
          {block.source.error || 'Upload failed.'} Tap to try again.
        </div>
      )}

      <div className="row" style={{ padding: '6px 10px', gap: 6 }}>
        <button type="button" className="media-mode-btn secondary" onClick={() => fileInputRef.current?.click()}>
          <Icon name="swap" size={13} /> Replace
        </button>
        <button type="button" className="media-mode-btn secondary" onClick={reset}>
          Change source
        </button>
      </div>

      <input
        className="media-caption-input"
        placeholder="Caption (optional)"
        value={block.caption}
        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_BY_KIND[block.kind] || '*/*'}
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}
