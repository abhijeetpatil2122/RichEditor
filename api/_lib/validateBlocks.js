// The client (src/document/richMessageBuilder.js) already builds the real
// Telegram `blocks` JSON. This is a defensive re-check on the server —
// reject anything malformed/oversized/disallowed before it reaches the
// Bot API, rather than trusting whatever the Mini App sent.

const RICH_TEXT_TYPES = new Set(['bold', 'italic', 'underline', 'strikethrough', 'code', 'url'])
const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'list',
  'blockquote',
  'expandable_blockquote',
  'pullquote',
  'table',
  'divider',
  'photo',
  'video'
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

function checkBlock(block) {
  if (!block || typeof block !== 'object' || !BLOCK_TYPES.has(block.type)) {
    throw new Error(`Unsupported block type: ${block?.type}`)
  }
  switch (block.type) {
    case 'paragraph':
      return checkRichText(block.text)
    case 'heading':
      if (!Number.isInteger(block.size) || block.size < 1 || block.size > 6) {
        throw new Error('Heading size must be 1-6.')
      }
      return checkRichText(block.text)
    case 'pullquote':
      checkRichText(block.text)
      if (block.credit !== undefined) checkRichText(block.credit)
      return
    case 'blockquote':
    case 'expandable_blockquote':
      if (!Array.isArray(block.blocks) || block.blocks.length > 50) throw new Error('Invalid quote content.')
      block.blocks.forEach(checkBlock)
      if (block.credit !== undefined) checkRichText(block.credit)
      return
    case 'list':
      if (!Array.isArray(block.items) || !block.items.length || block.items.length > 200) {
        throw new Error('Invalid list.')
      }
      block.items.forEach((item) => {
        if (!Array.isArray(item.blocks)) throw new Error('Invalid list item.')
        item.blocks.forEach(checkBlock)
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
      return
    }
    case 'divider':
      return
    case 'photo':
    case 'video': {
      const media = block[block.type]
      if (!media || typeof media.media !== 'string' || !media.media) {
        throw new Error(`Invalid ${block.type} block.`)
      }
      return
    }
  }
}

export function validateBlocks(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) throw new Error('The message is empty.')
  if (blocks.length > 300) throw new Error('The message has too many blocks.')
  blocks.forEach(checkBlock)
  if (JSON.stringify(blocks).length > 200_000) throw new Error('The message is too large.')
  return blocks
}
