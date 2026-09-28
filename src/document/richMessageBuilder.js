// Turns our editor document (src/document/schema.js) into the `blocks`
// array Telegram's sendRichMessage expects (Bot API 10.1–10.3, "Rich
// Messages"). This runs entirely in the browser (uses DOMParser) — the
// finished JSON is what actually gets POSTed to /api/send, and the
// server only re-validates shape/size, it does not rebuild it.
//
// Fields marked BEST-EFFORT below aren't documented anywhere we could
// verify at build time (Bot API 10.3 shipped Aug 24 2026, after most
// client-library docs were written) — confirm them with a real
// `sendRichMessage` curl call before relying on them, per your usual
// curl+jq workflow. Everything else here is taken directly from the
// current Bot API reference / client-library type stubs (aiogram,
// telegram.js, phptg).
import { BLOCK, LIST_STYLE, plainText } from './schema.js'

const INLINE_TAG_TO_TYPE = {
  B: 'bold',
  STRONG: 'bold',
  I: 'italic',
  EM: 'italic',
  U: 'underline',
  S: 'strikethrough',
  STRIKE: 'strikethrough',
  CODE: 'code'
}

/** Recursively turn a DOM node into a Telegram RichText value (string | array | {type,text,...}). */
function nodeToRichText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const children = Array.from(node.childNodes).map(nodeToRichText).filter((v) => v !== '')
  const inner = children.length === 0 ? '' : children.length === 1 ? children[0] : children

  const tag = node.tagName
  if (tag === 'A') {
    const href = node.getAttribute('href') || ''
    return { type: 'url', text: inner || href, url: href }
  }
  const mark = INLINE_TAG_TO_TYPE[tag]
  if (mark) return { type: mark, text: inner }
  // Unknown wrapper (e.g. the root DIV, or a <br>) — just flatten its children.
  if (tag === 'BR') return '\n'
  return inner
}

/** Sanitized inline HTML (from RichTextInput) -> Telegram RichText union. */
export function htmlToRichText(html) {
  const clean = (html || '').trim()
  if (!clean) return ''
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html')
  const root = doc.body.firstChild
  const value = nodeToRichText(root)
  return value === '' ? '' : value
}

function paragraphFromHtml(html) {
  return { type: 'paragraph', text: htmlToRichText(html) }
}

function buildListItem(item, style, index) {
  const out = { blocks: [paragraphFromHtml(item.html)] }
  if (style === LIST_STYLE.NUMBER) {
    out.type = '1'
    out.value = index + 1
  }
  if (style === LIST_STYLE.CHECKLIST) {
    out.has_checkbox = true
    out.is_checked = !!item.checked
  }
  return out
}

function buildTableCells(rows, align) {
  return rows.map((row) =>
    row.map((cell, colIndex) => {
      const out = {
        align: align[colIndex] || 'left',
        valign: 'middle'
      }
      const text = htmlToRichText(cell.text)
      if (text !== '') out.text = text
      if (cell.isHeader) out.is_header = true
      if (cell.colspan > 1) out.colspan = cell.colspan
      if (cell.rowspan > 1) out.rowspan = cell.rowspan
      return out
    })
  )
}

/** One editor block -> one (or more, for future block-splitting needs) Telegram block. */
function buildBlock(block) {
  switch (block.type) {
    case BLOCK.PARAGRAPH:
      return paragraphFromHtml(block.html)

    case BLOCK.HEADING:
      return { type: 'heading', text: htmlToRichText(block.html), size: block.size }

    case BLOCK.LIST:
      return {
        type: 'list',
        items: block.items
          .filter((i) => plainText(i.html).trim())
          .map((item, index) => buildListItem(item, block.style, index))
      }

    case BLOCK.BLOCKQUOTE: {
      const out = { type: 'blockquote', blocks: [paragraphFromHtml(block.html)] }
      if (block.credit?.trim()) out.credit = block.credit.trim()
      return out
    }

    case BLOCK.EXPANDABLE_BLOCKQUOTE: {
      // BEST-EFFORT: mirrors blockquote's shape (blocks + credit) plus an
      // is_open flag analogous to InputRichBlockDetails — the exact field
      // set for the Bot API 10.3 "expandable block quotation" class wasn't
      // available in the sources we checked. Verify with a live call.
      const out = {
        type: 'expandable_blockquote',
        blocks: [paragraphFromHtml(block.html)],
        is_open: !!block.isOpen
      }
      if (block.credit?.trim()) out.credit = block.credit.trim()
      return out
    }

    case BLOCK.PULLQUOTE: {
      const out = { type: 'pullquote', text: htmlToRichText(block.html) }
      if (block.credit?.trim()) out.credit = block.credit.trim()
      return out
    }

    case BLOCK.TABLE: {
      const out = {
        type: 'table',
        cells: buildTableCells(block.rows, block.align)
      }
      if (block.bordered) out.is_bordered = true
      if (block.striped) out.is_striped = true
      if (block.compact) out.is_compact = true
      if (block.caption?.trim()) out.caption = block.caption.trim()
      return out
    }

    case BLOCK.DIVIDER:
      return { type: 'divider' }

    case BLOCK.MEDIA: {
      if (!block.source) return null
      const mediaValue = block.source.mode === 'upload' ? block.source.fileId : block.source.url
      if (!mediaValue) return null
      const key = block.kind === 'video' ? 'video' : 'photo'
      const out = { type: key, [key]: { type: key, media: mediaValue } }
      // BEST-EFFORT: RichBlockCaption's exact field name wasn't confirmed;
      // { text } matches every other Telegram "caption-shaped" object.
      if (block.caption?.trim()) out.caption = { text: htmlToRichText(block.caption) }
      return out
    }

    default:
      return null
  }
}

/** Editor document -> { blocks } ready to send as InputRichMessage.blocks. */
export function buildRichMessageBlocks(doc) {
  return doc.blocks.map(buildBlock).filter(Boolean)
}
