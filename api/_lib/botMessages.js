// Bot-side command replies, built as Rich Messages (sendRichMessage) rather
// than plain sendMessage, per the project's own format. Deliberately simple
// placeholder copy for now — refine the actual wording later; this just
// establishes the pattern (and that /help, /howtouse, /about all exist and
// route correctly) with one shared `openEditorKeyboard()` button.
//
// This is intentionally separate from api/send.js: send.js is the Mini
// App's own authenticated "post this document" endpoint (initData,
// CloudStorage-verified channels, block validation). Commands here are
// plain bot replies straight to whoever messaged the bot — no Mini App
// payload involved — so they don't share that code path.

const APP_URL = process.env.APP_URL || ''

function openEditorKeyboard(text = '✏️ Open editor') {
  return APP_URL ? { inline_keyboard: [[{ text, web_app: { url: APP_URL } }]] } : undefined
}

const COMMANDS = {
  start: {
    blocks: [
      { type: 'heading', size: 2, text: 'Welcome {name} to Rich Message Editor 👋' },
      {
        type: 'paragraph',
        text: 'Build formatted posts — headings, quotes, lists, tables, media — right inside Bots Miniapp, and send them straight to a channel.'
      },
      {
        type: 'list',
        items: [
          { blocks: [{ type: 'paragraph', text: 'Open the editor below' }] },
          { blocks: [{ type: 'paragraph', text: 'Add and format blocks, with a live preview' }] },
          { blocks: [{ type: 'paragraph', text: 'Send to yourself to check it, or straight to a channel' }] }
        ]
      },
      { type: 'divider' },
      { type: 'footer', text: 'Need help? Send /help.' },
      {
        type: 'buttons',
        align: 'center',
        buttons: [
          {
            text: '✏️ Open editor',
            style: 'primary',
            web_app: { url: APP_URL }
          }
        ]
      }
    ]
  },

  help: {
    blocks: [
      { type: 'heading', size: 2, text: 'Help' },
      { type: 'paragraph', text: 'Available commands:' },
      {
        type: 'list',
        items: [
          { blocks: [{ type: 'paragraph', text: [{ type: 'bold', text: '/start' }, ' — open the editor'] }] },
          { blocks: [{ type: 'paragraph', text: [{ type: 'bold', text: '/howtouse' }, ' — a step-by-step walkthrough'] }] },
          { blocks: [{ type: 'paragraph', text: [{ type: 'bold', text: '/about' }, ' — what this bot is'] }] }
        ]
      },
      { type: 'divider' },
      { type: 'footer', text: 'This section will grow as features are added.' }
    ],
    keyboard: () => openEditorKeyboard()
  },

  howtouse: {
    blocks: [
      { type: 'heading', size: 2, text: 'How to use' },
      {
        type: 'list',
        items: [
          { type: '1', value: 1, blocks: [{ type: 'paragraph', text: 'Tap "Open editor" to launch the Mini App' }] },
          { type: '1', value: 2, blocks: [{ type: 'paragraph', text: 'Use the bottom toolbar to add blocks — text, headings, quotes, lists, tables, media, and more' }] },
          { type: '1', value: 3, blocks: [{ type: 'paragraph', text: 'Add your channel once in Settings (the bot needs to be an admin there, with permission to post)' }] },
          { type: '1', value: 4, blocks: [{ type: 'paragraph', text: 'Tap Send, then choose your chat with the bot to preview it, or the channel to post it' }] }
        ]
      }
    ],
    keyboard: () => openEditorKeyboard()
  },

  about: {
    blocks: [
      { type: 'heading', size: 2, text: 'About' },
      {
        type: 'paragraph',
        text: 'A Telegram Mini App for building Bot API Rich Messages visually, without hand-writing the JSON.'
      },
      { type: 'footer', text: 'Built with sendRichMessage — Bot API 10.x.' }
    ],
    keyboard: () => openEditorKeyboard()
  }
}

/** Returns { blocks, reply_markup? } for a known command, or null. */
export function getCommandMessage(command, user) {
  const entry = COMMANDS[command]
  if (!entry) return null
  const blocks = entry.blocks.map((block) => {
    if (command === 'start' && block.type === 'heading') {
      const firstName = typeof user?.first_name === 'string' ? user.first_name.trim() : ''
      const lastName = typeof user?.last_name === 'string' ? user.last_name.trim() : ''
      const name = [firstName, lastName].filter(Boolean).join(' ') || 'there'
      return { ...block, text: block.text.replace('{name}', name) }
    }
    return block
  })
  const reply_markup = entry.keyboard?.()
  return reply_markup ? { blocks, reply_markup } : { blocks }
}

/** For registering with setMyCommands (see README) — keep in sync with COMMANDS above. */
export const COMMAND_LIST = [
  { command: 'start', description: 'Open the Rich Message editor' },
  { command: 'help', description: 'List available commands' },
  { command: 'howtouse', description: 'Step-by-step walkthrough' },
  { command: 'about', description: 'What this bot is' }
]
