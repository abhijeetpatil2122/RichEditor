import React, { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useDocument } from '../store/DocumentContext.jsx'
import { TOOLBAR_CATEGORIES, INLINE_MARKS } from '../document/toolbarConfig.js'
import {
  applyInlineMark,
  clearInlineMarks,
  hasActiveSelection,
  insertRichButtonPlaceholder,
  finalizeRichButton,
  cancelRichButton
} from './blocks/shared/RichTextInput.jsx'
import ButtonEditorSheet from './blocks/shared/ButtonEditorSheet.jsx'

export default function BlockToolbar({ activeInputRef, lastBlockId }) {
  const { addBlock } = useDocument()
  const [selectionActive, setSelectionActive] = useState(false)
  const [buttonSheet, setButtonSheet] = useState(null) // { pendingId, initial } | null

  // Inline-mark buttons only make sense once some text is actually
  // selected — otherwise "bold" has nothing to apply to. The Rich Button
  // mark is the one exception (see handleMark).
  useEffect(() => {
    function onSelectionChange() {
      setSelectionActive(hasActiveSelection(activeInputRef.current))
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [activeInputRef])

  function handleMark(mark) {
    const el = activeInputRef.current
    if (!el) return

    if (mark.isButton) {
      const selection = window.getSelection()
      const label = selection && !selection.isCollapsed ? selection.toString() : ''
      const pendingId = insertRichButtonPlaceholder(el, label)
      if (!pendingId) return
      notifyChanged(el)
      setButtonSheet({ pendingId, initial: { text: label || 'Button', style: 'primary', actionType: 'url', dest: '' } })
      return
    }

    if (!hasActiveSelection(el)) return

    if (mark.isClear) {
      if (clearInlineMarks(el) !== null) notifyChanged(el)
      return
    }
    if (mark.isLink) {
      const url = window.prompt('Link URL')
      if (!url) return
      if (applyInlineMark(el, 'A', { href: url }) !== null) notifyChanged(el)
      return
    }
    if (applyInlineMark(el, mark.tag, mark.attrs) !== null) notifyChanged(el)
  }

  // applyInlineMark/clearInlineMarks mutate the DOM directly via the Range
  // API, which doesn't fire a React input event — dispatch one so the
  // owning RichTextInput re-reads innerHTML and saves it.
  function notifyChanged(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }))
    setSelectionActive(false)
  }

  function handleInsert(item) {
    addBlock(item.type, item.props || {}, lastBlockId)
  }

  return (
    <div className="block-toolbar">
      <div className="inline-marks-row">
        {INLINE_MARKS.map((mark) => (
          <button
            key={mark.id}
            className="icon-btn"
            type="button"
            disabled={!mark.isButton && !selectionActive}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark(mark)}
          >
            <Icon name={mark.icon} size={17} />
          </button>
        ))}
      </div>
      <div className="toolbar-scroll">
        {TOOLBAR_CATEGORIES.map((category, i) => (
          <React.Fragment key={category.id}>
            {i > 0 && <span className="toolbar-divider" />}
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
          </React.Fragment>
        ))}
      </div>

      <ButtonEditorSheet
        open={!!buttonSheet}
        initial={buttonSheet?.initial}
        onClose={() => {
          if (buttonSheet) cancelRichButton(buttonSheet.pendingId)
          setButtonSheet(null)
        }}
        onSave={(config) => {
          if (buttonSheet) finalizeRichButton(buttonSheet.pendingId, config)
          setButtonSheet(null)
        }}
      />
    </div>
  )
}
