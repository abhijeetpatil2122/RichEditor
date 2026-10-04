# Rich Message Editor — Telegram Mini App

A Telegram Mini App for visually building Bot API 10.x **Rich Messages**
and posting them to your private chat (for preview) or a saved channel.
Bot + Mini App both deploy to Vercel as a single project. No database —
saved channels live in the user's own Telegram **CloudStorage**.

## Repo tree

```
rich-message-editor/
├── index.html
├── vite.config.js
├── vercel.json
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx                 screen switcher, boots Telegram SDK, wires SettingsButton/BackButton
│   ├── styles/
│   │   ├── theme.css           --tg-theme-* vars, button reset (fixes round-avatar bug on Android WebView)
│   │   └── app.css
│   ├── telegram/
│   │   ├── webApp.js           window.Telegram.WebApp wrapper (haptics, MainButton, SettingsButton, popups…)
│   │   ├── api.js               fetch wrapper to /api/*, attaches initData
│   │   └── channelStorage.js   CloudStorage-backed saved-channels list (index key + per-channel key)
│   ├── document/
│   │   ├── schema.js            block data model + factories — 15 block types
│   │   ├── history.js           undo/redo stack
│   │   ├── toolbarConfig.js     bottom-toolbar categories/icons + inline-mark list
│   │   └── richMessageBuilder.js  editor doc -> real Telegram `blocks` JSON
│   ├── store/
│   │   └── DocumentContext.jsx  central state (add/update/delete/move block, undo/redo)
│   ├── editor/
│   │   ├── EditorScreen.jsx     header + canvas + toolbar, wires the MainButton (hidden on Settings/empty)
│   │   ├── EditorHeader.jsx     undo/redo (left) + profile avatar (right)
│   │   ├── BlockToolbar.jsx     inline marks (selection-gated) + scrollable block-insert categories
│   │   ├── BlockRenderer.jsx    per-block wrapper: delete / move up / move down (always visible now)
│   │   ├── SendSheet.jsx        bottom sheet: private chat + saved channels
│   │   └── blocks/
│   │       ├── ParagraphBlock.jsx
│   │       ├── HeadingBlock.jsx        tap the "H2 ▾" chip to cycle H1-H6
│   │       ├── PreformattedBlock.jsx   code block + language picker
│   │       ├── FooterBlock.jsx
│   │       ├── ListBlock.jsx           bullet / numbered / checklist
│   │       ├── BlockquoteBlock.jsx     also handles the collapsible (expandable) variant
│   │       ├── PullquoteBlock.jsx
│   │       ├── TableBlock.jsx
│   │       ├── DetailsBlock.jsx        <details>/<summary>, open-by-default toggle
│   │       ├── DividerBlock.jsx
│   │       ├── MathBlock.jsx           raw LaTeX passthrough
│   │       ├── MapBlock.jsx            manual lat/lon/zoom/size inputs
│   │       ├── MediaBlock.jsx          photo/video/gif/audio/voice/file — paste-URL or upload, swappable
│   │       ├── MultiMediaBlock.jsx     collage / slideshow grid with one shared caption
│   │       └── shared/
│   │           ├── RichTextInput.jsx        contenteditable field — see "cursor bugs" below
│   │           ├── sanitizeInlineHtml.js    whitelists inline tags incl. sub/sup/mark/spoiler
│   │           └── useMediaUpload.js        shared upload-to-bot helper
│   ├── settings/
│   │   ├── SettingsScreen.jsx   profile card + saved-channels list (no in-app header — native BackButton)
│   │   └── ChannelForm.jsx      verify (server) + save (CloudStorage)
│   └── components/
│       ├── Icon.jsx             lucide-react, wrapped behind name-based lookup
│       ├── BottomSheet.jsx
│       └── Toast.jsx
└── api/
    ├── _lib/
    │   ├── telegram.js          Bot API HTTP/upload calls + initData HMAC verification
    │   ├── validateBlocks.js    re-validates the client-built blocks JSON before sending
    │   └── botMessages.js       Rich Message content for /start, /help, /howtouse, /about
    ├── webhook.js               routes bot commands to botMessages.js, sends via sendRichMessage
    ├── send.js                  sendRichMessage — re-verifies bot admin rights for channel targets
    ├── channels/
    │   └── verify.js            getChat + getChatMember only — nothing persisted server-side
    └── media/
        ├── upload.js            uploads to the user's own chat, returns a file_id (all media kinds)
        └── file.js              proxies a file_id to raw bytes for <img>/<video> src
```

## This update

**Native destructive popup.** Removing a channel now uses
`WebApp.showPopup` (Bot API 6.2+) with a `destructive`-type button instead
of `showConfirm` — Telegram renders that button in its own native
destructive color automatically (it's not part of our DOM, so there's no
CSS variable to set on our end). See `showPopup` in `src/telegram/webApp.js`.

**Destructive color on the channel delete icon.** The CSS rule for it was
accidentally scoped to `.block-controls .icon-btn.delete` (the per-block
delete buttons in the editor) and never matched the Settings screen's
channel-row delete button, which was falling back to plain text color.
Now a plain `.icon-btn.delete` rule, so it applies everywhere.

**Removed media/map/collage caption "credit" field.** Added last round,
but it was redundant with the existing caption — removed again; those
blocks are back to a single caption field each. (Blockquote/pullquote's
separate `credit` field is unrelated and unchanged — that's the attribution
line under an actual quote, a different concept.)

**Clear-formatting button hardened.** Couldn't fully pin down why it
wasn't working from static review, so rather than guess, it now runs
`execCommand('removeFormat')` first (the browser's own long-tested
handling of standard tags) *and* the manual plain-text-replacement pass
as a follow-up (needed anyway for the custom tags — sub/sup/mark/spoiler
— which aren't "standard formatting" as far as `execCommand` is
concerned). If it's still broken after this, the next report should say
exactly what you selected and what happened — that'll narrow it down for
real rather than another guess.

**Math rendering.** Added `katex` — the math block now renders live under
the textarea as you type, using the same LaTeX that gets sent.

**Bot commands.** `/start`, `/help`, `/howtouse`, `/about` now all exist,
each replying via `sendRichMessage` (not plain `sendMessage`) through a
new `api/_lib/botMessages.js` — kept deliberately separate from
`api/send.js`, since that one is the Mini App's authenticated
document-sending endpoint (initData, block validation, channel re-check)
and these are just plain bot replies to whoever messaged it, no Mini App
payload involved. Copy is placeholder-simple on purpose, per your "just
the initial test command" ask — refine the wording whenever.

One assumption worth a curl check: `reply_markup` is sent as a top-level
field alongside `rich_message` in the `sendRichMessage` call (same
pattern every other `send*` method uses for attaching an inline
keyboard). Not confirmed against a live call yet.

**Register the commands with Telegram** so they show up in the client's
command menu (run once, or again whenever `COMMAND_LIST` changes):

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setMyCommands" \
  -H 'content-type: application/json' \
  -d '{"commands": [
    {"command": "start", "description": "Open the Rich Message editor"},
    {"command": "help", "description": "List available commands"},
    {"command": "howtouse", "description": "Step-by-step walkthrough"},
    {"command": "about", "description": "What this bot is"}
  ]}' | jq
```

## Still simplified / not built

- Collage/slideshow items are photo/video only (no mixed captions per item).
- `details` body is a single paragraph, not arbitrary nested blocks.
- Map has no visual picker — it's raw number inputs.
- No drag-and-drop reorder (up/down buttons only).
- No i18n/RTL toggle.

## Setup

**1. Create the bot** with [@BotFather](https://t.me/BotFather), grab the
token, and set up a Mini App (`/newapp`) pointing at your Vercel URL.

**2. Set environment variables** (copy `.env.example` → Vercel project
settings): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (make one up),
`APP_URL` (your deployed URL, no trailing slash). No database to provision.

**3. Deploy.**

```bash
npm i -g vercel   # if you don't have it
vercel --prod
```

**4. Point the webhook at your deployment:**

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/api/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" | jq
```

**5. Sanity-check it:**

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq
```

## Local dev

`npm run dev` runs the Vite frontend only — no Telegram SDK, no `/api`
routes, no CloudStorage (it no-ops outside a real Telegram client). Good
for layout/CSS; use a real deploy (or `vercel dev`) to test send/upload/
channel flows.
