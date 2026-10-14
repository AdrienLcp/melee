---
description: Privacy — no cookies, device storage for the user's own state, every key and third party on the /legal page, data about people that ends
paths:
  - "apps/game/src/features/legal/**"
  - "apps/game/src/infrastructure/storage/**"
  - "apps/game/src/infrastructure/browser.ts"
  - "apps/game/src/presentation/theme/theme-store.ts"
  - "apps/game/index.html"
  - "apps/server/src/infrastructure/logging/**"
  - "apps/server/src/infrastructure/music/**"
  - "apps/server/src/infrastructure/worker/**"
  - "apps/server/src/domain/room/room-deadlines.ts"
  - "apps/server/wrangler.jsonc"
---

# Privacy

Taverla is published from France by a private individual, so French law and
the GDPR apply. Everything below keeps it inside the consent exemptions, which
is why it has no cookie banner. `/:locale/legal` (`features/legal/`) is where
the site says all of it, and **the page is true only while the code agrees** —
a change to what is stored, kept or sent changes the page in the same commit.

## Nothing is stored that the user did not ask for

- **No cookies**, first- or third-party.
- **Device storage holds the user's own preferences and state** — the theme,
  the locale, a nickname, a seat, a host token, a setup, a volume, a slate key.
  Each key is exported from its storage module and listed on the legal page by
  that constant, with what it remembers and, where it ends, when: a new key is
  a new row in `LOCAL_KEYS` or `SESSION_KEYS` and a sentence in both
  dictionaries.
- **Audience is measured only by the cookieless tracker** loaded in
  `index.html` (`analytics.adrienlcp.com`, source in `C:/git/analytics`). The
  legal page tells visitors, and its switch writes `analytics:ignore` =
  `'true'` to `localStorage` and removes it to resume
  (`infrastructure/storage/analytics-opt-out-storage.ts`). Global Privacy
  Control (`sendsGlobalPrivacyControl` in `infrastructure/browser.ts`) refuses
  it too. Raw records are kept 25 months at most.

## Data about people has an end

A table's Durable Object holds nicknames, answers and scores, and it goes when
the host closes the table or `ABANDONED_ROOM_GRACE_MS` after the last screen
leaves. Anything new kept server-side about a person states its retention on
the legal page and has a deletion path — "kept forever" is not a retention.
Lengthening the grace, or keeping a table past it, rewrites
`legal.storage.server` in both dictionaries.

## What leaves is disclosed

Every request to a third party that carries user data or the visitor's IP is
on the legal page. Today that is **Cloudflare** (the host; the room-creation
rate limiter keys on `CF-Connecting-IP`) and **Deezer**: the server sends it
the host's search or playlist, and the browser loads the 30-second clips and
the covers straight from Deezer's CDN, so Deezer receives the visitor's IP.
When the user types something that leaves the site, the field says where it
goes, naming the service — `blindtest.source.queryHint` under the search,
`playlistIdHint` under the playlist id.

## Logs keep no more than the page claims

`observability` is on, so Cloudflare logs every request with its IP and user
agent, kept three days. A log line written here carries codes, counts and
paths — a room code, a fault, a reason — never a nickname, an answer or a
search the user typed. `legal.storage.logs` states this; a log that needs more
changes the page first.
