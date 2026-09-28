import React from 'react'
import Icon from '../components/Icon.jsx'
import { useDocument } from '../store/DocumentContext.jsx'
import { TOOLBAR_CATEGORIES, INLINE_MARKS } from '../document/toolbarConfig.js'
import { applyInlineMark } from './blocks/shared/RichTextInput.jsx'

const MARK_TAG = {
  bold: 'B',
  italic: 'I',
  underline: 'U',
  strikethrough: 'S',
  code: 'CODE'
}

export default function BlockToolbar({ activeInputRef, lastBlockId }) {
  const { addBlock, updateBlock } = useDocument()

  function handleMark(mark) {
    const el = activeInputRef.current
    if (!el) return

    if (mark.command === 'link') {
      const url = window.prompt('Link URL')
      if (!url) return
      if (applyInlineMark(el, 'A', { href: url }) !== null) notifyChanged(el)
      return
    }

    const tag = MARK_TAG[mark.command === 'strikeThrough' ? 'strikethrough' : mark.command]
    if (!tag) return
    if (applyInlineMark(el, tag) !== null) notifyChanged(el)
  }

  // applyInlineMark already mutated the DOM directly via the Range API, which
  // doesn't fire a React input event on its own — dispatch one so the owning
  // RichTextInput's onInput handler re-reads innerHTML and saves it.
  function notifyChanged(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function handleInsert(item) {
    addBlock(item.type, item.props || {}, lastBlockId)
  }

  return (
    <div className="block-toolbar">
      <div className="inline-marks-row">
        {INLINE_MARKS.map((mark) => (
          <button key={mark.id} className="icon-btn" type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleMark(mark)}>
            <Icon name={mark.icon} size={17} />
          </button>
        ))}
      </div>
      <div className="toolbar-scroll">
        {TOOLBAR_CATEGORIES.map((category) => (
          <div className="toolbar-category" key={category.id}>
            <span className="toolbar-category-label">{category.label}</span>
            <div className="toolbar-items">
              {category.items.map((item) => (
                <button key={item.id} className="toolbar-item" type="button" onClick={() => handleInsert(item)}>
                  <span className="icon-circle">
                    <Icon name={item.icon} size={17} />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
