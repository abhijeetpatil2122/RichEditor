# Rich Message Editor — Telegram Mini App

A Telegram Mini App for visually building Bot API 10.x **Rich Messages**
(headings, quotes, lists, tables, media) and posting them to your private
chat (for preview) or a saved channel. Bot + Mini App both deploy to Vercel
as a single project.

## Repo tree

```
rich-message-editor/
├── index.html                 Vite entry, loads the Telegram WebApp SDK script
├── vite.config.js
├── vercel.json                 build output + serverless function config
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx                 screen switcher (editor / settings), boots Telegram SDK
│   ├── styles/
│   │   ├── theme.css           --tg-theme-* vars (+ browser-preview fallbacks)
│   │   └── app.css             all layout/component styles
│   ├── telegram/
│   │   ├── webApp.js           window.Telegram.WebApp wrapper (haptics, MainButton, popups…)
│   │   └── api.js              fetch wrapper to /api/*, attaches initData
│   ├── document/
│   │   ├── schema.js           editor's block data model + factories
│   │   ├── history.js          undo/redo stack
│   │   ├── toolbarConfig.js    bottom-toolbar categories/icons — edit this to add block types
│   │   └── richMessageBuilder.js   editor doc -> real Telegram `blocks` JSON
│   ├── store/
│   │   └── DocumentContext.jsx central state (add/update/delete/move block, undo/redo)
│   ├── editor/
│   │   ├── EditorScreen.jsx    header + canvas + toolbar, wires the MainButton
│   │   ├── EditorHeader.jsx    undo/redo (left) + profile avatar (right)
│   │   ├── BlockToolbar.jsx    inline marks row + scrollable block-insert categories
│   │   ├── BlockRenderer.jsx   per-block wrapper: delete / move up / move down
│   │   ├── SendSheet.jsx       bottom sheet: private chat + saved channels
│   │   └── blocks/
│   │       ├── ParagraphBlock.jsx
│   │       ├── HeadingBlock.jsx        tap the "H2 ▾" chip to cycle H1-H6
│   │       ├── ListBlock.jsx           bullet / numbered / checklist
│   │       ├── BlockquoteBlock.jsx     also handles the expandable variant
│   │       ├── PullquoteBlock.jsx
│   │       ├── TableBlock.jsx          rows/cols, per-column align, border/stripe/compact
│   │       ├── DividerBlock.jsx
│   │       ├── MediaBlock.jsx          paste-URL or gallery upload (see media flow below)
│   │       └── shared/
│   │           ├── RichTextInput.jsx        contenteditable inline-formatting field
│   │           └── sanitizeInlineHtml.js    whitelists b/i/u/s/code/a, strips everything else
│   ├── settings/
│   │   ├── SettingsScreen.jsx  profile card + saved-channels list
│   │   └── ChannelForm.jsx     add + verify a channel
│   └── components/
│       ├── Icon.jsx            small inline-SVG icon set (no icon-library dependency)
│       ├── BottomSheet.jsx     generic animated sheet (backdrop-tap / ✕ to close)
│       └── Toast.jsx           green/red banner after a send
└── api/                        Vercel serverless functions (the "bot")
    ├── _lib/
    │   ├── telegram.js         Bot API HTTP calls + initData HMAC verification
    │   ├── kv.js                Vercel KV: per-user saved-channel storage
    │   └── validateBlocks.js   re-validates the client-built blocks JSON before sending
    ├── webhook.js              Telegram webhook: handles /start
    ├── send.js                 sendRichMessage to private chat or a saved channel
    ├── channels/
    │   ├── add.js              verify (getChat + getChatMember) then save
    │   ├── list.js
    │   └── remove.js
    └── media/
        ├── upload.js           uploads a picked file to the user's own chat, returns file_id
        └── file.js             proxies a file_id to raw bytes for <img>/<video> src
```

## How a few tricky parts work

**Rich Message building.** `src/document/richMessageBuilder.js` runs in the
browser and turns the editor's blocks into the exact JSON `sendRichMessage`
expects (Bot API 10.1–10.3). A couple of fields are marked `BEST-EFFORT` in
that file's comments — the expandable-blockquote shape and the photo/video
caption shape weren't confirmed anywhere at the time this was built (Bot API
10.3 shipped Aug 24 2026). **Test those two with a raw curl call before you
rely on them**, e.g.:

```bash
curl -s "https://api.telegram.org/bot$TOKEN/sendRichMessage" \
  -H 'content-type: application/json' \
  -d '{"chat_id": YOUR_ID, "rich_message": {"blocks": [{"type":"expandable_blockquote","blocks":[{"type":"paragraph","text":"hi"}],"is_open":true}]}}' | jq
```

If Telegram rejects a field, `api/_lib/validateBlocks.js` and
`richMessageBuilder.js` are the two places to fix it.

**Media upload.** There's no Mini App API that hands raw gallery bytes to
JS, so `MediaBlock.jsx` uses a plain `<input type="file">`, shows an instant
local preview via `URL.createObjectURL`, and in the background POSTs the
file (base64) to `/api/media/upload`, which sends it to *your own chat with
the bot* and keeps the `file_id` Telegram returns. That `file_id` is what
actually gets used in the outgoing Rich Message — no extra storage needed.
`/api/media/file.js` is a small proxy so the editor can *display* an
already-uploaded file without ever exposing the bot token to the browser.

**Channels.** Saved in Vercel KV, keyed by the Telegram user id, and
re-verified with `getChatMember` every time you add one. `api/send.js`
double-checks a channel is actually in *that user's* saved list before
calling `sendRichMessage` — the client can't just pass an arbitrary
`chat_id`.

## Not built yet (flagged in the code, not silently skipped)

- Collage/slideshow (multi-photo) blocks, math expressions, buttons blocks,
  maps, documents, voice notes — the toolbar only exposes the block types
  in `toolbarConfig.js`; add an entry there + a case in
  `richMessageBuilder.js` + a component in `editor/blocks/` to add one.
- Block reordering is up/down buttons, not drag-and-drop.
- No i18n / RTL toggle (`InputRichMessage.is_rtl` exists but isn't wired up).

## Setup

**1. Create the bot** with [@BotFather](https://t.me/BotFather), grab the
token, and set up a Mini App (`/newapp`) pointing at your Vercel URL.

**2. Add Vercel KV.** In the Vercel dashboard → your project → Storage →
add the "KV" integration. It injects `KV_REST_API_URL`/`KV_REST_API_TOKEN`
automatically.

**3. Set environment variables** (copy `.env.example` → Vercel project
settings): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (make one up),
`APP_URL` (your deployed URL, no trailing slash).

**4. Deploy.**

```bash
npm i -g vercel   # if you don't have it
vercel --prod
```

**5. Point the webhook at your deployment:**

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/api/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" | jq
```

**6. Sanity-check it:**

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq
```

Then message your bot `/start` in Telegram — it should reply with an
"Open editor" button.

## Local dev

`npm run dev` runs the Vite frontend only (no Telegram SDK, no `/api`
routes — those need `vercel dev` or a real deploy). Good for iterating on
layout/CSS; block logic that reaches into `window.Telegram.WebApp` no-ops
gracefully outside a real client (see `src/telegram/webApp.js`).
