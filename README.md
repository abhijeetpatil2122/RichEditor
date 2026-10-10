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
│   │       ├── ButtonsBlock.jsx        block-level button row (left/center/right align)
│   │       └── shared/
│   │           ├── RichTextInput.jsx        contenteditable field — see "cursor bugs" below
│   │           ├── sanitizeInlineHtml.js    whitelists inline tags incl. sub/sup/mark/spoiler/inline-math/rich-button
│   │           ├── useMediaUpload.js        shared cancellable upload-to-bot helper
│   │           └── ButtonEditorSheet.jsx    text/style/action-type form, used by both button features below
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
    │   ├── chatAccess.js        shared "can the bot actually send here" check (channel admin vs group/supergroup member rules)
    │   └── botMessages.js       Rich Message content for /start, /help, /howtouse, /about
    ├── webhook.js               routes bot commands to botMessages.js, sends via sendRichMessage
    ├── send.js                  sendRichMessage — re-verifies send rights for channel/group targets
    ├── channels/
    │   └── verify.js            getChat + getChatMember only (channel, group, or supergroup) — nothing persisted server-side
    └── media/
        ├── upload.js            uploads to the user's own chat, returns a file_id (all media kinds)
        └── file.js              proxies a file_id to raw bytes for <img>/<video> src
```

## This update

**Group & supergroup support**, not just channels. `api/channels/verify.js`
and `api/send.js` both now branch on `chat.type`: channels still need the
bot to be admin with "Post messages" rights (only admins can post in a
channel at all); groups/supergroups just need the bot to be a member and
not explicitly restricted from sending — that's the real permission model,
not an arbitrary relaxation. The shared check lives in
`api/_lib/chatAccess.js` so both endpoints can't drift apart. Settings now
shows "Channel" / "Group" next to each saved chat.

**Quote/pullquote credit now supports inline formatting.** Confirmed
`credit?: RichText` (not plain string) in the type definitions — it was
rendered as a plain `<input>` before, so formatting could never reach it.
Renamed the field `creditHtml` and swapped in the same `RichTextInput`
everything else uses.

**Table cells support inline formatting too**, same fix, same component.
This incidentally fixes a real bug: cells were raw uncontrolled
`contentEditable` elements synced only on blur, so toggling Striped/
Bordered/Compact while a cell was still focus — before you'd blurred out
of it — re-rendered the table with each cell's last-*saved* content,
silently discarding whatever you'd just typed. `RichTextInput` already
never touches the DOM while focused, so cells get that fix for free now.

**Inline math.** `{type: 'mathematical_expression', expression}` — the
*other* math type referenced in the docs, separate from the block-level
one added earlier. Select some LaTeX source text and tap the inline math
mark to convert it; shown as a styled (not live-rendered) span inline —
rendering it live inside running contenteditable text is a materially
harder problem than the block-level preview, not attempted here.

**Rich Button (inline) and Buttons block — both added.** Per the API,
these are genuinely different things sharing one button shape
(`{text, style, url | callback_data | web_app}`, `style` one of
primary/success/danger/link — note "link" is only valid on callback
buttons, the form disables it otherwise):
- *Rich Button*: an inline mark, usable mid-sentence. Tapping it inserts a
  placeholder at the cursor immediately (while the field still has focus —
  see the code comment in `RichTextInput.jsx` for why that timing matters)
  and opens a form to fill in label/style/action/destination; Save or
  Cancel updates or removes that placeholder by its id.
- *Buttons block*: a standalone row, 1+ buttons, left/center/right aligned.
Both reuse the same `ButtonEditorSheet` component, so there's one form to
maintain instead of two.

**Heading default was H2, now H1** — `toolbarConfig.js` was passing
`{ size: 2 }` to the new-heading button.

**Destructive popup** (last round's item) and the **clear-formatting
button** you confirmed is now working — no changes needed there.

**Removed the media/map/collage caption "credit" field** added two
rounds ago — redundant with caption, reverted, as asked.

## Still simplified / not built

- Collage/slideshow items are photo/video only (no mixed captions per item).
- Rich Button / Buttons block only support url, callback_data, and web_app actions — not login_url, switch_inline*, or copy_text (all real but niche).
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
