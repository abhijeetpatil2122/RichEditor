// The client (src/document/richMessageBuilder.js) already builds the real
// Telegram `blocks` JSON. This is a defensive re-check on the server —
// reject anything malformed/oversized/disallowed before it reaches the
// Bot API, rather than trusting whatever the Mini App sent.

const RICH_TEXT_TYPES = new Set([
  'bold', 'italic', 'underline', 'strikethrough', 'code', 'url',
  'subscript', 'superscript', 'marked', 'spoiler'
])

const MEDIA_BLOCK_TYPES = new Set(['photo', 'video', 'animation', 'audio', 'document', 'voice_note'])

const BLOCK_TYPES = new Set([
  'paragraph', 'heading', 'pre', 'footer', 'list', 'blockquote',
  'expandable_blockquote', 'pullquote', 'table', 'details', 'divider',
  'mathematical_expression', 'map', 'collage', 'slideshow',
  ...MEDIA_BLOCK_TYPES
])

function checkRichText(value, depth = 0) {
  if (depth > 12) throw new Error('Rich text is nested too deeply.')
  if (typeof value === 'string') {
    if (value.length > 8000) throw new Error('A text block is too long.')
    return
  }
  if (Array.isArray(value)) {
    if (value.length > 200) throw new Error('A text block has too many parts.')
    value.forEach((v) => checkRichText(v, depth + 1))
    return
  }
  if (!value || typeof value !== 'object' || !RICH_TEXT_TYPES.has(value.type)) {
    throw new Error('Unsupported inline formatting.')
  }
  checkRichText(value.text, depth + 1)
  if (value.type === 'url') {
    if (typeof value.url !== 'string' || !/^(https?:|tg:)\/\//i.test(value.url)) {
      throw new Error('Links must use http(s):// or tg:// URLs.')
    }
  }
}

function checkCaption(caption) {
  if (caption === undefined) return
  if (!caption || typeof caption !== 'object') throw new Error('Invalid caption.')
  checkRichText(caption.text)
  if (caption.credit !== undefined) checkRichText(caption.credit)
}

function checkMediaBlock(block) {
  const media = block[block.type]
  if (!media || typeof media.media !== 'string' || !media.media) {
    throw new Error(`Invalid ${block.type} block.`)
  }
  checkCaption(block.caption)
}

function checkBlock(block, depth = 0) {
  if (depth > 6) throw new Error('Blocks are nested too deeply.')
  if (!block || typeof block !== 'object' || !BLOCK_TYPES.has(block.type)) {
    throw new Error(`Unsupported block type: ${block?.type}`)
  }

  if (MEDIA_BLOCK_TYPES.has(block.type)) return checkMediaBlock(block)

  switch (block.type) {
    case 'paragraph':
    case 'footer':
      return checkRichText(block.text)
    case 'heading':
      if (!Number.isInteger(block.size) || block.size < 1 || block.size > 6) {
        throw new Error('Heading size must be 1-6.')
      }
      return checkRichText(block.text)
    case 'pre':
      if (typeof block.text !== 'string' || block.text.length > 20000) throw new Error('Invalid code block.')
      return
    case 'pullquote':
      checkRichText(block.text)
      if (block.credit !== undefined) checkRichText(block.credit)
      return
    case 'expandable_blockquote':
      checkRichText(block.text)
      if (block.credit !== undefined) checkRichText(block.credit)
      return
    case 'blockquote':
      if (!Array.isArray(block.blocks) || block.blocks.length > 50) throw new Error('Invalid quote content.')
      block.blocks.forEach((b) => checkBlock(b, depth + 1))
      if (block.credit !== undefined) checkRichText(block.credit)
      return
    case 'list':
      if (!Array.isArray(block.items) || !block.items.length || block.items.length > 200) {
        throw new Error('Invalid list.')
      }
      block.items.forEach((item) => {
        if (!Array.isArray(item.blocks)) throw new Error('Invalid list item.')
        item.blocks.forEach((b) => checkBlock(b, depth + 1))
      })
      return
    case 'table': {
      if (!Array.isArray(block.cells) || block.cells.length > 100) throw new Error('Invalid table.')
      block.cells.forEach((row) => {
        if (!Array.isArray(row) || row.length > 30) throw new Error('Invalid table row.')
        row.forEach((cell) => {
          if (cell.text !== undefined) checkRichText(cell.text)
        })
      })
      if (block.caption !== undefined) checkRichText(block.caption)
      return
    }
    case 'details':
      checkRichText(block.summary)
      if (!Array.isArray(block.blocks) || block.blocks.length > 20) throw new Error('Invalid details content.')
      block.blocks.forEach((b) => checkBlock(b, depth + 1))
      return
    case 'divider':
      return
    case 'mathematical_expression':
      if (typeof block.expression !== 'string' || !block.expression || block.expression.length > 4000) {
        throw new Error('Invalid math expression.')
      }
      return
    case 'map':
      if (!block.location || typeof block.location.latitude !== 'number' || typeof block.location.longitude !== 'number') {
        throw new Error('Invalid map location.')
      }
      checkCaption(block.caption)
      return
    case 'collage':
    case 'slideshow':
      if (!Array.isArray(block.blocks) || !block.blocks.length || block.blocks.length > 20) {
        throw new Error(`Invalid ${block.type}.`)
      }
      block.blocks.forEach((b) => checkBlock(b, depth + 1))
      checkCaption(block.caption)
      return
  }
}

export function validateBlocks(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) throw new Error('The message is empty.')
  if (blocks.length > 300) throw new Error('The message has too many blocks.')
  blocks.forEach((b) => checkBlock(b))
  if (JSON.stringify(blocks).length > 200_000) throw new Error('The message is too large.')
  return blocks
}
