// The editor's own document model. This is intentionally simpler/flatter
// than Telegram's real RichBlock union — richMessageBuilder.js is the only
// place that needs to know how to turn this into the real API payload.
// Adding a new block type = add a case here, a renderer in editor/blocks/,
// a toolbar entry in toolbarConfig.js, and a case in richMessageBuilder.js.

export const BLOCK = Object.freeze({
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  LIST: 'list',
  BLOCKQUOTE: 'blockquote',
  EXPANDABLE_BLOCKQUOTE: 'expandable_blockquote',
  PULLQUOTE: 'pullquote',
  TABLE: 'table',
  DIVIDER: 'divider',
  MEDIA: 'media'
})

export const LIST_STYLE = Object.freeze({
  BULLET: 'bullet',
  NUMBER: 'number',
  CHECKLIST: 'checklist'
})

let idCounter = 0
export function uid(prefix = 'b') {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`
}

/** Plain string / rich-run value stored as sanitized inline HTML (see RichTextInput). */
const emptyRich = () => ''

export function createBlock(type, overrides = {}) {
  const id = uid(type)
  switch (type) {
    case BLOCK.PARAGRAPH:
      return { id, type, html: emptyRich(), ...overrides }
    case BLOCK.HEADING:
      return { id, type, html: emptyRich(), size: overrides.size || 2, ...overrides }
    case BLOCK.LIST:
      return {
        id,
        type,
        style: overrides.style || LIST_STYLE.BULLET,
        items: overrides.items?.length
          ? overrides.items
          : [{ id: uid('li'), html: emptyRich(), checked: false }],
        ...overrides
      }
    case BLOCK.BLOCKQUOTE:
    case BLOCK.EXPANDABLE_BLOCKQUOTE:
      return { id, type, html: emptyRich(), credit: '', isOpen: true, ...overrides }
    case BLOCK.PULLQUOTE:
      return { id, type, html: emptyRich(), credit: '', ...overrides }
    case BLOCK.TABLE:
      return {
        id,
        type,
        bordered: true,
        striped: false,
        compact: false,
        caption: '',
        align: ['left', 'left'],
        rows:
          overrides.rows || [
            [
              { text: '', isHeader: true },
              { text: '', isHeader: true }
            ],
            [
              { text: '', isHeader: false },
              { text: '', isHeader: false }
            ]
          ],
        ...overrides
      }
    case BLOCK.DIVIDER:
      return { id, type }
    case BLOCK.MEDIA:
      return {
        id,
        type,
        kind: overrides.kind || 'photo', // 'photo' | 'video'
        source: null, // { mode: 'url', url } | { mode: 'upload', previewUrl, fileId, status }
        caption: '',
        ...overrides
      }
    default:
      throw new Error(`Unknown block type: ${type}`)
  }
}

export function createInitialDocument() {
  return { blocks: [createBlock(BLOCK.PARAGRAPH)] }
}

export function isDocumentEmpty(doc) {
  if (!doc?.blocks?.length) return true
  return doc.blocks.every((b) => {
    if (b.type === BLOCK.DIVIDER) return false
    if (b.type === BLOCK.TABLE) return false
    if (b.type === BLOCK.MEDIA) return !b.source
    if (b.type === BLOCK.LIST) return b.items.every((i) => !plainText(i.html).trim())
    return !plainText(b.html).trim()
  })
}

/** Strip HTML tags to get plain text length/content checks. */
export function plainText(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}
