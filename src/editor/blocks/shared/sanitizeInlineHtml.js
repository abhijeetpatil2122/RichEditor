const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'A', 'BR'])

function cleanNode(node, out) {
  if (node.nodeType === Node.TEXT_NODE) {
    out.appendChild(document.createTextNode(node.textContent))
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return

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
  // Unknown wrapper (div/span/font from a paste, etc.) — keep its children,
  // drop the wrapper itself so we don't accumulate junk markup.
  node.childNodes.forEach((child) => cleanNode(child, out))
}

/** Raw (possibly pasted) HTML -> whitelisted inline HTML string. */
export function sanitizeInlineHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild
  const clean = document.createElement('div')
  root.childNodes.forEach((child) => cleanNode(child, clean))
  return clean.innerHTML
}

