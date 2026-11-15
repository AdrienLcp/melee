# Observability

What the deployed game tells us about itself, and where to read it.

| Source            | Holds                                                                              | Kept    | Read with                                     |
| ----------------- | ---------------------------------------------------------------------------------- | ------- | --------------------------------------------- |
| Workers Logs      | every request, and every `logger` line                                             | 3 days  | Cloudflare dashboard → Workers → melee → Logs |
| `reports` (D1)    | each screen's errors, the server's own, reported clips, reports sent from the menu | 30 days | `wrangler d1 execute` (below)                 |
| `rooms_live` (D1) | one row per open room: game, phase, seats, walls                                   | 1 day   | written by every room as it changes           |

## Error reports

A screen sends one with `navigator.sendBeacon` to `POST /api/reports`
(`fetch` with `keepalive` where the beacon is refused) from
`apps/game/src/infrastructure/diagnostics.ts`, the only module that builds
one. What triggers it, as `kind`:

| `kind`                | Sent when                                                                 | `code`                              |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| `uncaught`            | React's `onUncaughtError`, or a `window` `error` no handler caught        | —                                   |
| `caught-by-boundary`  | React's `onCaughtError`, and the root error screen                        | —                                   |
| `unhandled-rejection` | a `window` `unhandledrejection`                                           | —                                   |
| `refused-frame`       | the server answered `invalid_message` to a frame this app built           | the refusal's code                  |
| `socket-fatal`        | a fatal refusal other than an exit somebody chose (`room_closed`, …)      | the refusal's code                  |
| `clip-fault`          | the speaker reports its clip silent (`speaker.reportClip`)                | `blocked`, `unreachable`, `stalled` |
| `server-error`        | written by the server: an unhandled error in a route (`answerUnexpected`) | —                                   |
| `clip-reported`       | written by the server: the `speaker.reportClip` it received               | the fault                           |

`source` is `client` or `server`; a silent clip makes one row of each, the
client's carrying the browser and audio state, the server's proving the frame
arrived.

The context — `errorReportSchema` in `packages/protocol/src/http.ts` is the
whole list — is the error's name, message and stack (truncated), the entry
chunk's hashed name (`client_build`) and the server's commit (`server_build`),
the route, the role, whether the screen is the speaker, the browser's family,
major.minor version and system read off the user agent, the viewport and
pixel ratio, the room's code, game, phase and round, the cue context's state,
this device's stored volume (`null` is the 80% default), the last
`MediaError.code`, and the types of the last 20 frames either way, the clock's
ping and pong left out.

**Never** a nickname, an answer, typed text, a session id, a host token, a
frame's payload, the raw user agent or an IP address. The schema is closed —
`strictObject` all the way down, enums and patterns for everything but the
error's own text — so none has a field to travel in, and `http.test.ts` fails
if one is accepted. `/legal` says this in both dictionaries
(`legal.storage.errorReports`).

A `window` `error` that is a browser's notice rather than a fault — the
`ResizeObserver` loop notice, a bare message with no `Error` behind it — goes
into the trail as an `uncaught` event and is never sent as a report
(`helpers/browser-notice.ts`). The loop itself is still a fault to fix where
it starts: the menu's leaflet sized to its content raised it on every
disclosure opened inside, until it took a width.

Limits: identical faults are sent once and ten at most per page load
(`helpers/report-gate.ts`); the body is refused past 16 KiB before parsing; the
`REPORT_LIMITER` binding keeps 20 a minute per room, or per address for a
screen in no room — the address is the limiter's key and is never written.
Reports are operational, not audience: the analytics opt-out does not stop
them.

## Reports somebody sends

The menu's _Report a problem_ (`presentation/components/report-problem.tsx`),
on every screen at every phase, sends one to `POST /api/bug-reports` when its
_Send_ is pressed, and never otherwise. `reportProblem` in `bug-report.ts`
builds it from what `diagnostics.ts` kept (`reportTrailAt`) and what
`browser-device.ts` reads at the press — both in the menu's chunk, so only the
ring that records the screen runs from the entry — `bugReportSchema` in `packages/protocol/src/http.ts` is the whole
list, and it is kept in the same `reports` table with `kind = 'bug-report'`,
`source = 'client'`, the person's note in `error_message` (500 characters; the
whole note is in `context`) and everything else in `context`:

- **the note** (`note`, up to 2000 characters, often empty);
- **the device**: the raw `userAgent`, `userAgentData` (client hints, Chromium
  only), `inAppBrowser` (Instagram, Messenger, WhatsApp, Facebook, TikTok,
  Snapchat, read off the user agent), `screen` with `devicePixelRatio` and
  orientation, `viewport`, `visualViewport` (height, width, offsets, scale),
  `safeArea` (the resolved `env(safe-area-inset-*)`), `preferences` (colour
  scheme, reduced motion, theme, locale), `build`;
- **the room**: `role` (`host`, `seated-host`, `player`, `wall`,
  `front-door`), `roomCode`, `game`, `phase`, `roundIndex`,
  `roundContentKind`, `settings`, and `view` — this screen's own room view,
  nicknames included, never another role's; dropped first when the body
  would pass 64 KiB;
- **the wire**: `connection` (socket status, clock offset and round trip)
  and the types of the last 20 `frames`;
- **the trail**: `events`, what the screen went through in the two minutes
  before `sentAt` — `viewport-resize` and `viewport-scroll` (the visual
  viewport's values and `innerHeight`), `window-resize`, `orientation`,
  `focus-in` / `focus-out` (the element's tag, role, type, name, class and
  `data-*`, never its value), `visibility`, `route`, `socket-open` /
  `socket-close` (code, reason, clean) / `socket-error`, `uncaught`,
  `unhandled-rejection` and `console-error` (message and stack, 2000
  characters). Each carries `ago`, milliseconds before `sentAt`, and `count`:
  a run of one type less than 120ms apart is one entry holding the last
  values (`helpers/event-ring.ts`). The ring is filled from the first script
  on (`watchScreenForReports`, `main.tsx`) and holds 200; the oldest go first
  when the body would pass 64 KiB (`helpers/fitted-bug-report.ts`).

Never a session id, a host token or an address. Limits: the menu offers no
second send for 30 seconds on one page (`BUG_REPORT_COOLDOWN_MS`), and
`BUG_REPORT_LIMITER` keeps two a minute per address within a room — the
address is the limiter's key and is never written. The Worker also writes one
`A screen sent a bug report` line to Workers Logs, holding the room code,
game, phase, role, route, browser, in-app browser, whether there is a note
and how many events, with the report's `receivedAt` to find its row — never
the note or the view.

### Reading them

On `/admin`, _Reports_ filtered by the kind `bug-report`. From `apps/server`:

```sh
# The last twenty sent, newest first, with their notes
pnpm exec wrangler d1 execute OBSERVABILITY --remote --command \
  "SELECT id, datetime(received_at / 1000, 'unixepoch') AS at, role, game, phase,
          room_code, browser_name, browser_version, system, error_message AS note
   FROM reports WHERE kind = 'bug-report' ORDER BY received_at DESC LIMIT 20"

# One report whole: device, room, view and the event trail
pnpm exec wrangler d1 execute OBSERVABILITY --remote --json --command \
  "SELECT context FROM reports WHERE id = 42"

# The trail alone, oldest first, of the last report from an in-app browser
pnpm exec wrangler d1 execute OBSERVABILITY --remote --json --command \
  "SELECT json_extract(e.value, '$.ago') AS ago, json_extract(e.value, '$.type') AS type,
          json_extract(e.value, '$.count') AS n, json_extract(e.value, '$.detail') AS detail
   FROM reports, json_each(reports.context, '$.events') AS e
   WHERE reports.id = (SELECT id FROM reports WHERE kind = 'bug-report'
               AND json_extract(context, '$.inAppBrowser') IS NOT NULL
               ORDER BY received_at DESC LIMIT 1)
   ORDER BY ago DESC"
```

Add `--env staging` for staging, and `--local` for the copy `pnpm dev`
writes. The same rows answer the admin API, for a session holding the
admin key: `GET /api/admin/reports?kind=bug-report` lists them and
`GET /api/admin/reports/:id` returns one with its whole `context`, both with
`Authorization: Bearer <ADMIN_TOKEN>`.

## The back office: `/admin`

`/admin` on any environment (`https://staging.melee.adrienlcp.com/admin`,
the production host likewise) asks for the admin key and keeps it in memory
alone: a reload asks again. The key is the Worker secret `ADMIN_TOKEN`, set on
`melee` and `melee-staging` with `wrangler secret put`, and its value lives in
the owner's password manager, which fills the field. `pnpm dev` reads a local-only key from
`apps/server/.dev.vars` (git-ignored). The page calls
`GET /api/admin/rooms`, `/api/admin/reports` and `/api/admin/reports/:id`
with `Authorization: Bearer <key>`; anything else — no key, a wrong one, a
Worker with no secret — answers 404, so the routes cannot be told from absent
ones. Cloudflare Access would have put an email login in front instead, but it
is not enabled on the account, so the bearer key stands in.

- **Live tables** lists each `rooms_live` row, refreshed every ten seconds:
  code, game, phase, round, seats, walls, when it opened and last moved, and a
  closed room until the daily sweep takes it. A room writes its row on every
  change of game, phase, round, seats or walls, and at least every five
  minutes (`LIVE_ROOM_TOUCH_MS`), through `waitUntil` so no frame waits on it.
- **Reports** lists the reports kept, newest first, filtered by kind,
  browser, game, build, table code and window; a row opens beside the list on
  a wide screen, in its place on a narrow one, with every context field, the
  frame trail and the stack.

## Reading them in SQL

The databases are `melee-observability` (production) and
`melee-staging-observability` (staging), bound as `OBSERVABILITY`. From
`apps/server`, with the wrangler login on the machine:

```sh
# The last twenty, newest first
pnpm exec wrangler d1 execute OBSERVABILITY --remote --command \
  "SELECT id, datetime(received_at / 1000, 'unixepoch') AS at, source, kind, code,
          error_name, error_message, browser_name, browser_version, system, role,
          game, phase, room_code
   FROM reports ORDER BY received_at DESC LIMIT 20"

# One report's whole context
pnpm exec wrangler d1 execute OBSERVABILITY --remote --command \
  "SELECT context FROM reports WHERE id = 42"

# What broke most this week, by browser
pnpm exec wrangler d1 execute OBSERVABILITY --remote --command \
  "SELECT kind, error_message, browser_name, browser_version, count(*) AS n
   FROM reports WHERE received_at > (unixepoch() - 7 * 86400) * 1000
   GROUP BY 1, 2, 3, 4 ORDER BY n DESC LIMIT 20"
```

Add `--env staging` for staging, and `--local` instead of `--remote` for the
copy `pnpm dev` writes to (`apps/server/.wrangler/state`).

## Schema and retention

Migrations live in `apps/server/migrations/`. `pnpm dev` applies them to the
local copy, the e2e server to its own state directory, and each deploy job
(`ci.yaml` for staging, `deploy-production.yaml`) to its environment before the
Worker ships — so a migration stays additive: the Worker it lands under is
still the previous one. The daily Cron Trigger (`23 3 * * *`, `worker.ts`)
deletes reports older than `REPORT_RETENTION_MS` and `rooms_live` rows untouched
for `LIVE_ROOM_STALE_MS`.

## Log lines

`logger` lines about a room carry `code`, `game` and `phase`
(`roomLogFields`), and `role` where a socket is known. They are searchable
in Workers Logs for three days; never put a nickname, an answer or a raw frame
in one (`logger.ts`).
