import React from 'react'

// Minimal geometric icon set — a placeholder visual language you can swap
// for Telegram's own icon set later. Kept dependency-free on purpose so
// `npm install` stays fast on a phone connection.
const PATHS = {
  undo: 'M9 14 4 9l5-5M4 9h10a5 5 0 0 1 0 10h-2',
  redo: 'M15 14l5-5-5-5M20 9H10a5 5 0 0 0 0 10h2',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4a7.97 7.97 0 0 0-.2-1.8l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-3.1-1.8L14 2h-4l-.3 2.4a8 8 0 0 0-3.1 1.8l-2.5-1-2 3.4L4.2 10.2A8 8 0 0 0 4 12c0 .6.1 1.2.2 1.8l-2.1 1.6 2 3.4 2.5-1a8 8 0 0 0 3.1 1.8L10 22h4l.3-2.4a8 8 0 0 0 3.1-1.8l2.5 1 2-3.4-2.1-1.6c.1-.6.2-1.2.2-1.8Z',
  paragraph: 'M12 4h7M12 4a4 4 0 1 0 0 8h1V4M13 4v16M8 20h8',
  heading: 'M4 5v14M14 5v14M4 12h10M18 8v3m0 0v3m0-3h2m-2 0h-2',
  quote: 'M7 9c-2 0-3 1.5-3 3.5S5 16 7 16s3-1.5 3-3.5S9 9 7 9Zm10 0c-2 0-3 1.5-3 3.5s1 3.5 3 3.5 3-1.5 3-3.5S19 9 17 9Z',
  'quote-expand': 'M7 9c-2 0-3 1.5-3 3.5S5 16 7 16s3-1.5 3-3.5S9 9 7 9Zm10 0c-2 0-3 1.5-3 3.5s1 3.5 3 3.5 3-1.5 3-3.5S19 9 17 9ZM9 20l3-3 3 3',
  pullquote: 'M6 8h4v4l-2 4H6l1.5-4H6V8Zm8 0h4v4l-2 4h-2l1.5-4H14V8Z',
  'list-bullet': 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  'list-number': 'M9 6h11M9 12h11M9 18h11M4 5.5V8m0 0h1m-1 0h1M4 12h2l-2 2.5h2M4.5 17c.6-.4 1.5-.1 1.5.6 0 .4-.3.6-.8.9-.5.3-.7.6-.7 1h1.5',
  'list-check': 'M9 6h11M9 12h11M9 18h11M4.5 6.5l1 1L7.5 5M4.5 12.5l1 1 2-2M4.5 18.5l1 1 2-2',
  image: 'M4 5h16v14H4V5Zm3 10 3.5-4 2.5 3 2-2.5L19 16H7ZM8 9a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 8 9Z',
  video: 'M4 6h11v12H4V6Zm11 4 5-3v10l-5-3v-4Z',
  table: 'M4 5h16v14H4V5Zm0 5h16M4 15h16M10 5v14',
  divider: 'M5 12h14',
  bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7V5Zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7Z',
  italic: 'M10 5h7M7 19h7M13.5 5 10.5 19',
  underline: 'M6 4v7a6 6 0 0 0 12 0V4M5 20h14',
  strikethrough: 'M5 12h14M8 7c0-1.7 1.8-3 4-3s4 1.1 4 2.6M8 17c0 1.7 1.8 3 4 3s4-1.3 4-3',
  code: 'M9 7 4 12l5 5M15 7l5 5-5 5',
  link: 'M9 15l6-6M8 12l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2',
  close: 'M6 6l12 12M18 6 6 18',
  send: 'm3 11 18-8-8 18-2-8-8-2Z',
  trash: 'M6 7h12M9 7V5h6v2m-8 0 1 13h8l1-13',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  'chevron-up': 'm6 15 6-6 6 6',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-right': 'm9 6 6 6-6 6',
  check: 'm5 13 4 4 10-10',
  error: 'M12 9v4m0 4h.01M12 3l9 16H3l9-16Z',
  upload: 'M12 16V4m0 0 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2',
  spinner: 'M12 3a9 9 0 1 0 9 9'
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '', style }) {
  const d = PATHS[name]
  if (!d) return null
  const filled = name === 'send'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={`icon icon-${name} ${name === 'spinner' ? 'icon-spin' : ''} ${className}`}
    >
      <path d={d} />
    </svg>
  )
}
