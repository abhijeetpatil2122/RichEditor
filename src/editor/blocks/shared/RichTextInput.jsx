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
    placeCaretAfterNode(selection, br)
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

/**
 * Places the caret right after `node` using a zero-width-space text node as
 * an anchor, instead of just "after the element" with nothing there. A bare
 * setStartAfter(el)/collapse(true) with no following text node is ambiguous
 * in most browsers' contenteditable implementations — typing right after
 * that keeps inheriting the formatting of the preceding element (the
 * "formatting keeps continuing" bug) and a trailing <br> with nothing after
 * it can fail to render a visible line. An explicit plain-text anchor fixes
 * both. The ZWSP is invisible and gets stripped on blur (sanitizeInlineHtml).
 */
function placeCaretAfterNode(selection, node) {
  const anchor = document.createTextNode('\u200B')
  node.parentNode.insertBefore(anchor, node.nextSibling)
  const range = document.createRange()
  range.setStart(anchor, 1)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
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

  // Anchor the caret just after the formatted element so typing continues
  // as plain text instead of inheriting bold/italic/etc.
  placeCaretAfterNode(selection, el)

  return sanitizeInlineHtml(container.innerHTML)
}

/**
 * Strips all inline formatting from the current selection back to plain
 * text. Runs execCommand('removeFormat') first — the browser's own
 * built-in, battle-tested handling of the standard tags — then does a
 * manual plain-text replacement pass as well, since our custom tags
 * (sub/sup/mark/spoiler-span) aren't "standard formatting" as far as
 * execCommand is concerned and wouldn't otherwise be touched.
 */
export function clearInlineMarks(container) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer) || range.collapsed) return null

  try {
    document.execCommand('removeFormat')
  } catch {
    // Unsupported in this engine — the manual pass below still runs.
  }

  const current = window.getSelection()
  const liveRange = current?.rangeCount ? current.getRangeAt(0) : null
  if (!liveRange || liveRange.collapsed || !container.contains(liveRange.commonAncestorContainer)) {
    return sanitizeInlineHtml(container.innerHTML)
  }

  const text = liveRange.toString()
  liveRange.deleteContents()
  const node = document.createTextNode(text)
  liveRange.insertNode(node)

  placeCaretAfterNode(current, node)

  return sanitizeInlineHtml(container.innerHTML)
}
