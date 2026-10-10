const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'A', 'BR', 'SUB', 'SUP', 'MARK', 'SPAN'
])

// Our three special-purpose SPAN markers. Each one's content is flattened
// to plain text on purpose — a spoiler can contain nested formatting (it's
// just a visual mask), but a Rich Button's label and an inline math
// expression are both plain-text-only per the Bot API's own RichText spec.
const SPAN_ATTRS = {
  spoiler: ['data-spoiler'],
  'inline-math': ['data-inline-math'],
  // data-pending-id is temporary — only present while the ButtonEditorSheet
  // is open for this button — and must survive sanitize until then (the
  // sheet's own inputs blur the field, which runs sanitize). Stripped once
  // the sheet saves/cancels (see ButtonsBlock/BlockToolbar).
  'rich-button': ['data-rich-button', 'data-style', 'data-action-type', 'data-dest', 'data-pending-id']
}

function cleanSpan(node, out) {
  for (const attrs of Object.values(SPAN_ATTRS)) {
    const [marker] = attrs
    if (node.getAttribute(marker) !== 'true') continue
    const el = document.createElement('SPAN')
    attrs.forEach((name) => {
      const value = node.getAttribute(name)
      if (value != null) el.setAttribute(name, value)
    })
    el.textContent = node.textContent.replace(/\u200B/g, '')
    out.appendChild(el)
    return true
  }
  return false
}

function cleanNode(node, out) {
  if (node.nodeType === Node.TEXT_NODE) {
    // Strip zero-width spaces — these are only ever a transient caret
    // anchor inserted by RichTextInput after formatting/line-break
    // operations (see placeCaretAfterNode) and should never reach saved
    // content or the outgoing message.
    const text = node.textContent.replace(/\u200B/g, '')
    if (text) out.appendChild(document.createTextNode(text))
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return

  if (node.tagName === 'SPAN') {
    if (cleanSpan(node, out)) return
    // Not one of ours (paste junk — font/layout spans) — unwrap it.
    node.childNodes.forEach((child) => cleanNode(child, out))
    return
  }

  if (ALLOWED_TAGS.has(node.tagName)) {
    const el = document.createElement(node.tagName)
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (/^(https?:|tg:)/i.test(href)) el.setAttribute('href', href)
    }
    node.childNodes.forEach((child) => cleanNode(child, el))
    out.appendChild(el)
    return
  }
  // Unknown wrapper (div/p from a browser's default Enter behavior, or
  // font/span junk from a paste) — keep its children, drop the wrapper
  // itself, but insert a line break first so content on its own line in
  // the source doesn't get silently glued onto the previous line.
  const blockLevel = node.tagName === 'DIV' || node.tagName === 'P'
  if (blockLevel && out.childNodes.length > 0) {
    out.appendChild(document.createElement('br'))
  }
  node.childNodes.forEach((child) => cleanNode(child, out))
}

/** Raw (possibly pasted, or Enter-mangled) HTML -> whitelisted inline HTML string. */
export function sanitizeInlineHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild
  const clean = document.createElement('div')
  root.childNodes.forEach((child) => cleanNode(child, clean))
  return clean.innerHTML
}
