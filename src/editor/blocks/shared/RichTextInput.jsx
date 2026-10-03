import React, { useEffect, useRef } from 'react'
import { sanitizeInlineHtml } from './sanitizeInlineHtml.js'

/**
 * A single formattable text field. Selection-based bold/italic/etc. are
 * applied by the parent editor via BlockToolbar, which finds the
 * currently-focused RichTextInput's DOM node through `activeInputRef`.
 *
 * Important: while the field is focused we NEVER reassign `innerHTML`.
 * Doing that mid-edit is what causes the cursor to jump to the start —
 * the browser has no way to know where your caret was inside content it
 * didn't just render itself. We only sanitize (strip anything outside our
 * tag whitelist) on blur and on paste, when there's no caret position left
 * to preserve.
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

  useEffect(() => {
    if (!ref.current || isFocused.current) return
    if (ref.current.innerHTML !== (html || '')) {
      ref.current.innerHTML = html || ''
    }
  }, [html])

  function insertLineBreak() {
    const selection = window.getSelection()
    if (!selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const br = document.createElement('br')
    range.insertNode(br)
    range.setStartAfter(br)
    range.setEndAfter(br)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    onChange?.(ref.current.innerHTML)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!multiline) {
        onChange?.(ref.current.innerHTML)
        onEnterNext?.()
      } else {
        insertLineBreak()
      }
      return
    }
    if (e.key === 'Backspace' && !multiline && !ref.current?.textContent?.length) {
      e.preventDefault()
      onBackspaceEmpty?.()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    onChange?.(ref.current.innerHTML)
  }

  return (
    <div
      ref={ref}
      className={`rich-input ${className}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={() => onChange?.(ref.current.innerHTML)}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        isFocused.current = true
        if (activeInputRef) activeInputRef.current = ref.current
        onFocus?.(e)
      }}
      onBlur={(e) => {
        isFocused.current = false
        const clean = sanitizeInlineHtml(ref.current.innerHTML)
        if (clean !== ref.current.innerHTML) ref.current.innerHTML = clean
        onChange?.(clean)
        onBlur?.(e)
      }}
    />
  )
}

/** True if there's a non-collapsed text selection currently inside `container`. */
export function hasActiveSelection(container) {
  if (!container) return false
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false
  return container.contains(selection.getRangeAt(0).commonAncestorContainer)
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

  // Put the caret right after the new element so typing continues as
  // plain text instead of leaving the selection in limbo.
  const after = document.createRange()
  after.setStartAfter(el)
  after.collapse(true)
  selection.removeAllRanges()
  selection.addRange(after)

  return sanitizeInlineHtml(container.innerHTML)
}

/** Strips all inline formatting from the current selection back to plain text. */
export function clearInlineMarks(container) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer) || range.collapsed) return null

  const text = range.toString()
  range.deleteContents()
  const node = document.createTextNode(text)
  range.insertNode(node)

  const after = document.createRange()
  after.setStartAfter(node)
  after.collapse(true)
  selection.removeAllRanges()
  selection.addRange(after)

  return sanitizeInlineHtml(container.innerHTML)
}
