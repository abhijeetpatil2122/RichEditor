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
    │   └── validateBlocks.js    re-validates the client-built blocks JSON before sending
    ├── webhook.js               /start
    ├── send.js                  sendRichMessage — re-verifies bot admin rights for channel targets
    ├── channels/
    │   └── verify.js            getChat + getChatMember only — nothing persisted server-side
    └── media/
        ├── upload.js            uploads to the user's own chat, returns a file_id (all media kinds)
        └── file.js              proxies a file_id to raw bytes for <img>/<video> src
```

## This update

**Backend crash fixed.** `api/send.js` imported `../_lib/telegram.js` but
the file lives at `api/_lib/telegram.js` — one level up from
`api/send.js`, not two. Vercel's bundler resolved it to a path outside
`/var/task` entirely, hence `ERR_MODULE_NOT_FOUND`. Fixed to `./_lib/...`.
(The files under `api/channels/` and `api/media/` already had the right
`../_lib/...` since they're one directory deeper.)

**Storage moved to CloudStorage.** `@vercel/kv` and `api/channels/{list,add,remove}.js`
are gone. `src/telegram/channelStorage.js` now saves/loads/removes
channels directly from the Mini App via `window.Telegram.WebApp.CloudStorage`
(same index-key + per-item-key pattern as your earlier repo) — nothing to
provision, and it's per-user/per-bot permanent storage. `api/channels/verify.js`
only checks the bot's admin rights and returns the channel; it saves
nothing. `api/send.js` re-checks those same admin rights at send time
instead of trusting a saved list, since that's the actual security
boundary (the bot can only ever post where it's actually an admin).

**Cursor/Enter bugs.** The real cause: `RichTextInput` was sanitizing and
reassigning `innerHTML` on *every keystroke*. Reassigning `innerHTML` while
a field is focused always collapses the cursor (the browser has no idea
where your caret was inside content it didn't just render) — that's what
"Enter jumps to start" and general cursor weirdness were. Fixed: typing
no longer touches the DOM at all; sanitization only happens on blur/paste,
when there's no caret to preserve. Enter is now handled explicitly (inserts
a real `<br>` via the Range API) instead of letting the browser's default
per-line-`<div>` behavior run — which the sanitizer was silently eating,
causing the "no newline support" bug in quotes/paragraphs.

**Other bug fixes:**
- Block delete/move buttons now sit in normal layout flow above each
  block (always visible) instead of an absolutely-positioned, hover-only
  overlay — that's what was making them vanish/overlap on touch.
- Header/settings avatar is reliably round now (`appearance: none` on the
  button reset — some Android WebViews ignore `border-radius` on a
  `<button>` without it).
- Checklist checkmark is bigger and bolder (was 12px/1.8 stroke, barely
  visible at that size).
- Removed the card/background box behind blockquotes and media+caption —
  they're flush now, matching how Telegram actually renders them in-chat.
- Settings screen no longer has its own header; the native `BackButton`
  (already wired in `App.jsx`) handles navigation back to the editor.
- `MainButton` is explicitly hidden when the editor screen unmounts
  (navigating to Settings) — it has its own global state in Telegram and
  doesn't hide itself just because the React component went away.
- Native `SettingsButton` is now enabled and opens the Settings screen
  (`configureSettingsButton` existed before but was never called).

**Inline formatting.** Bold/italic/etc. buttons are disabled unless you
actually have text selected (tracked via `selectionchange`), there's a
"clear formatting" button, and the caret is placed right after newly
formatted text instead of being left in limbo. Added subscript,
superscript, `marked` (highlight), and spoiler — all confirmed real
`RichText` variants (see below).

**Icons.** Swapped the hand-drawn SVG set for `lucide-react`, still behind
the same `<Icon name="..." />` API so nothing else had to change.

**New block types**, added after checking the actual Bot API 10.3 type
definitions (`@grammyjs/types`, which has the exact shapes — the public
docs page is too large to fetch in one piece): preformatted/code block
with a language picker, footer, collapsible blockquote with optional
credit (confirmed: it takes `text` directly, not nested `blocks`, and has
no open/closed field — it's always collapsed-until-tapped), details
(`<summary>` + open-by-default toggle), raw-LaTeX math block, map (manual
lat/lon/zoom/size — no interactive picker), and collage/slideshow (grid of
photo/video items with one shared caption). Media blocks now also support
GIF, audio, voice note, and generic file, all through the same
upload-to-bot-chat round trip as photo/video.

## Still simplified / not built

- Collage/slideshow items are photo/video only (no mixed captions per item).
- `details` body is a single paragraph, not arbitrary nested blocks.
- Map has no visual picker — it's raw number inputs.
- Math block shows raw LaTeX text, doesn't render it visually in the editor.
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
