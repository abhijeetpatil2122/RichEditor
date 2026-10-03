import React from 'react'
import { useDocument } from '../../store/DocumentContext.jsx'

export default function MathBlock({ block }) {
  const { updateBlock } = useDocument()
  return (
    <div className="math-block">
      <textarea
        value={block.expression}
        placeholder="LaTeX expression, e.g. \\frac{a}{b} = c"
        spellCheck={false}
        onChange={(e) => updateBlock(block.id, { expression: e.target.value }, { coalesceKey: `math:${block.id}` })}
      />
      <div className="hint">Raw LaTeX source — Telegram renders it; this editor just shows the text.</div>
    </div>
  )
}
