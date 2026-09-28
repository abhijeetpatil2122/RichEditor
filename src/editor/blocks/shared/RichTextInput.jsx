import React, { useEffect, useRef } from 'react'
import { sanitizeInlineHtml } from './sanitizeInlineHtml.js'

/**
 * A single formattable text field. Selection-based bold/italic/underline/
 * strikethrough/code/link are applied by the parent editor via the ref's
 * `applyMark(command)` — see BlockToolbar's inline-marks row, which finds
 * the currently-focused RichTextInput through `activeInputRef`.
 */
export default function RichTextInput({
  html,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Write something…',
  multiline = true,
  onEnterNext,
  onBackspaceEmpty,
  className = '',
  activeInputRef
}) {
  const ref = useRef(null)
  const isFocused = useRef(false)

  // Only push the prop into the DOM when we're not actively editing it —
  // otherwise every keystroke would reset the cursor to the end.
  useEffect(() => {
    if (!ref.current) return
    if (isFocused.current) return
    if (ref.current.innerHTML !== (html || '')) {
      ref.current.innerHTML = html || ''
    }
  }, [html])

  function commit() {
    if (!ref.current) return
    const clean = sanitizeInlineHtml(ref.current.innerHTML)
    if (clean !== ref.current.innerHTML) ref.current.innerHTML = clean
    onChange?.(clean)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      commit()
      onEnterNext?.()
      return
    }
    if (e.key === 'Backspace' && !multiline) {
      const empty = !ref.current?.textContent?.length
      if (empty) {
        e.preventDefault()
        onBackspaceEmpty?.()
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <div
      ref={ref}
      className={`rich-input ${className}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={commit}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        isFocused.current = true
        if (activeInputRef) activeInputRef.current = ref.current
        onFocus?.(e)
      }}
      onBlur={(e) => {
        isFocused.current = false
        commit()
        onBlur?.(e)
      }}
    />
  )
}

/** Wraps the current selection (must be inside `container`) in `tagName`. Returns the new HTML, or null if there's no selection. */
export function applyInlineMark(container, tagName, attrs = {}) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer) || range.collapsed) return null

  const el = document.createElement(tagName)
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
  try {
    range.surroundContents(el)
  } catch {
    const contents = range.extractContents()
    el.appendChild(contents)
    range.insertNode(el)
  }
  selection.removeAllRanges()
  return sanitizeInlineHtml(container.innerHTML)
}
