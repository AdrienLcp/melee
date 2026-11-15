# Observability

What the deployed game tells us about itself, and where to read it.

| Source            | Holds                                                  | Kept    | Read with                                     |
| ----------------- | ------------------------------------------------------ | ------- | --------------------------------------------- |
| Workers Logs      | every request, and every `logger` line                 | 3 days  | Cloudflare dashboard → Workers → melee → Logs |
| `reports` (D1)    | each screen's errors, the server's own, reported clips | 30 days | `wrangler d1 execute` (below)                 |
| `rooms_live` (D1) | one row per open room: game, phase, seats, walls       | 1 day   | written from part 2b on; schema in place      |

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

Limits: identical faults are sent once and ten at most per page load
(`helpers/report-gate.ts`); the body is refused past 16 KiB before parsing; the
`REPORT_LIMITER` binding keeps 20 a minute per room, or per address for a
screen in no room — the address is the limiter's key and is never written.
Reports are operational, not audience: the analytics opt-out does not stop
them.

## Reading them

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
