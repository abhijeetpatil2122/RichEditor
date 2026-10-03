const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'A', 'BR', 'SUB', 'SUP', 'MARK', 'SPAN'
])

function cleanNode(node, out) {
  if (node.nodeType === Node.TEXT_NODE) {
    out.appendChild(document.createTextNode(node.textContent))
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return

  if (ALLOWED_TAGS.has(node.tagName)) {
    // Only allow SPAN through when it's our spoiler marker — otherwise it's
    // paste junk (font/layout spans) and should just be unwrapped below.
    if (node.tagName === 'SPAN' && node.getAttribute('data-spoiler') !== 'true') {
      node.childNodes.forEach((child) => cleanNode(child, out))
      return
    }
    const el = document.createElement(node.tagName)
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (/^(https?:|tg:)/i.test(href)) el.setAttribute('href', href)
    }
    if (node.tagName === 'SPAN') el.setAttribute('data-spoiler', 'true')
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
