import React from 'react'
import RichTextInput from './shared/RichTextInput.jsx'
import { useDocument } from '../../store/DocumentContext.jsx'
import { BLOCK } from '../../document/schema.js'

export default function BlockquoteBlock({ block, activeInputRef }) {
  const { updateBlock } = useDocument()
  const isExpandable = block.type === BLOCK.EXPANDABLE_BLOCKQUOTE

  return (
    <div className="blockquote-block">
      <div className="bar" />
      <div className="content">
        <RichTextInput
          html={block.html}
          onChange={(html) => updateBlock(block.id, { html })}
          placeholder="Quote"
          activeInputRef={activeInputRef}
        />
        <input
          className="credit-input"
          placeholder="Credit (optional)"
          value={block.credit}
          onChange={(e) => updateBlock(block.id, { credit: e.target.value })}
        />
        {isExpandable && <div className="expand-toggle">Shown collapsed in chat until the reader taps it</div>}
      </div>
    </div>
  )
}
