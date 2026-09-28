import React from 'react'
import RichTextInput from './shared/RichTextInput.jsx'
import { useDocument } from '../../store/DocumentContext.jsx'

export default function PullquoteBlock({ block, activeInputRef }) {
  const { updateBlock } = useDocument()
  return (
    <div className="pullquote-block">
      <RichTextInput
        html={block.html}
        onChange={(html) => updateBlock(block.id, { html })}
        placeholder="Pull quote"
        activeInputRef={activeInputRef}
      />
      <div className="credit-row">
        <span className="rule" />
        <input
          className="credit-input"
          placeholder="Credit"
          value={block.credit}
          onChange={(e) => updateBlock(block.id, { credit: e.target.value })}
        />
        <span className="rule" />
      </div>
    </div>
  )
}
