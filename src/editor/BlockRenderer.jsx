import React from 'react'
import Icon from '../components/Icon.jsx'
import { useDocument } from '../store/DocumentContext.jsx'
import { BLOCK } from '../document/schema.js'
import ParagraphBlock from './blocks/ParagraphBlock.jsx'
import HeadingBlock from './blocks/HeadingBlock.jsx'
import ListBlock from './blocks/ListBlock.jsx'
import BlockquoteBlock from './blocks/BlockquoteBlock.jsx'
import PullquoteBlock from './blocks/PullquoteBlock.jsx'
import TableBlock from './blocks/TableBlock.jsx'
import DividerBlock from './blocks/DividerBlock.jsx'
import MediaBlock from './blocks/MediaBlock.jsx'

const COMPONENTS = {
  [BLOCK.PARAGRAPH]: ParagraphBlock,
  [BLOCK.HEADING]: HeadingBlock,
  [BLOCK.LIST]: ListBlock,
  [BLOCK.BLOCKQUOTE]: BlockquoteBlock,
  [BLOCK.EXPANDABLE_BLOCKQUOTE]: BlockquoteBlock,
  [BLOCK.PULLQUOTE]: PullquoteBlock,
  [BLOCK.TABLE]: TableBlock,
  [BLOCK.DIVIDER]: DividerBlock,
  [BLOCK.MEDIA]: MediaBlock
}

export default function BlockRenderer({ block, index, total, activeInputRef }) {
  const { deleteBlock, moveBlock } = useDocument()
  const Comp = COMPONENTS[block.type]
  if (!Comp) return null

  return (
    <div className="block-wrap">
      <div className="block-controls">
        <button
          className="icon-btn"
          type="button"
          onClick={() => moveBlock(block.id, 'up')}
          disabled={index === 0}
          aria-label="Move up"
        >
          <Icon name="chevron-up" size={15} />
        </button>
        <button
          className="icon-btn"
          type="button"
          onClick={() => moveBlock(block.id, 'down')}
          disabled={index === total - 1}
          aria-label="Move down"
        >
          <Icon name="chevron-down" size={15} />
        </button>
        <button
          className="icon-btn delete"
          type="button"
          onClick={() => deleteBlock(block.id)}
          aria-label="Delete block"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
      <Comp block={block} activeInputRef={activeInputRef} />
    </div>
  )
}
