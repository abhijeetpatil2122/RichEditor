// Declarative toolbar config. Adding a block type to the toolbar is just
// adding an entry here — BlockToolbar.jsx renders whatever's in this list.
import { BLOCK, LIST_STYLE } from './schema.js'

export const TOOLBAR_CATEGORIES = [
  {
    id: 'text',
    label: 'Text',
    items: [
      { id: 'paragraph', icon: 'paragraph', label: 'Text', type: BLOCK.PARAGRAPH },
      { id: 'heading', icon: 'heading', label: 'Heading', type: BLOCK.HEADING, props: { size: 2 } }
    ]
  },
  {
    id: 'quote',
    label: 'Quotes',
    items: [
      { id: 'blockquote', icon: 'quote', label: 'Quote', type: BLOCK.BLOCKQUOTE },
      {
        id: 'expandable_blockquote',
        icon: 'quote-expand',
        label: 'Expandable',
        type: BLOCK.EXPANDABLE_BLOCKQUOTE
      },
      { id: 'pullquote', icon: 'pullquote', label: 'Pull quote', type: BLOCK.PULLQUOTE }
    ]
  },
  {
    id: 'list',
    label: 'Lists',
    items: [
      {
        id: 'list-bullet',
        icon: 'list-bullet',
        label: 'Bulleted',
        type: BLOCK.LIST,
        props: { style: LIST_STYLE.BULLET }
      },
      {
        id: 'list-number',
        icon: 'list-number',
        label: 'Numbered',
        type: BLOCK.LIST,
        props: { style: LIST_STYLE.NUMBER }
      },
      {
        id: 'list-check',
        icon: 'list-check',
        label: 'Checklist',
        type: BLOCK.LIST,
        props: { style: LIST_STYLE.CHECKLIST }
      }
    ]
  },
  {
    id: 'media',
    label: 'Media & tables',
    items: [
      { id: 'photo', icon: 'image', label: 'Photo', type: BLOCK.MEDIA, props: { kind: 'photo' } },
      { id: 'video', icon: 'video', label: 'Video', type: BLOCK.MEDIA, props: { kind: 'video' } },
      { id: 'table', icon: 'table', label: 'Table', type: BLOCK.TABLE }
    ]
  },
  {
    id: 'layout',
    label: 'Layout',
    items: [{ id: 'divider', icon: 'divider', label: 'Divider', type: BLOCK.DIVIDER }]
  }
]

/** Inline-formatting marks offered while a paragraph/heading/list-item is focused. */
export const INLINE_MARKS = [
  { id: 'bold', icon: 'bold', command: 'bold' },
  { id: 'italic', icon: 'italic', command: 'italic' },
  { id: 'underline', icon: 'underline', command: 'underline' },
  { id: 'strikethrough', icon: 'strikethrough', command: 'strikeThrough' },
  { id: 'code', icon: 'code', command: 'code' },
  { id: 'link', icon: 'link', command: 'link' }
]
