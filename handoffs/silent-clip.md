# A blind test with beeps but no music

> « il a joué hier soir avec des amis, mais apparemment ils n'avaient pas de son
> lors du blind test (alors qu'ils entendaient bien les bip du timer), on a
> peut-être dépassé le quota Deezer ? Je me demande s'il ne faut pas prévenir
> dans Melee avec un message si c'est le cas. »

Played the evening of 2026-10-31 by Adrien's brother, on prod.

## What the code says (read, not reproduced)

- **A Deezer quota is unlikely.** The Worker calls Deezer itself
  (`apps/server/src/infrastructure/music/deezer-client.ts:503-553`, refusals
  turned into `declared_error` at :526-538), and the signed preview URL is
  fetched as each round opens (`fetchHostTrack`, :189-216, from
  `drawPlayableTrack`, `apps/server/src/domain/round/track-pool.ts:30-82`). A
  refused draw does not open the round: the host gets `music_source_unavailable`
  (`round-conductor.ts:629-647`). Rounds ran, beeps counted down — so the draw
  worked.
- **Not the wrong speaker, not volume 0**: beeps and clip are switched by the
  same `isSpeaker` and `roomVolume` (`host-console-page.tsx:211-227`,
  `wall-page.tsx:78-106`), and beeps are muted at 0 too (`cue-audio.ts:25`).
- **The two paths are separate**: the clip is two `HTMLAudioElement`s
  (`apps/game/src/features/host/round-audio.ts`), loading the MP3 straight from
  Deezer's CDN, never proxied (`deezer-client.ts:93-95`); the beeps are
  synthesised on an `AudioContext` (`presentation/audio/cue-audio.ts`,
  `timer-cue.ts`). `armAudio` unlocks each on its own
  (`host-console-page.tsx:236`, `wall-page.tsx:125`), so one can live while the
  other is dead.
- **A failure is only caught at `play()`** (`round-audio.ts:46-57`, labelled by
  `clipRefusalFor`, `packages/core/src/blindtest/clip-audio.ts:71`). Nothing
  listens to the element's `error` / `stalled`, nothing notices a clip that
  "plays" with `currentTime` stuck at 0, nothing tells the server or the console.
  The wall's unlock without a press (`wall-page.tsx:133-137`) only shows a line
  on the wall.
- Watch the room-sound merge (`076d91df`, `1e9c27a1`, ~5 days old): a clip
  could die and the beeps live only if `view.round.content.audioUrl` is missing
  on the speaker — check that path first.

## Steps

1. **Read last night's logs before guessing.** Worker observability is on
   (`apps/server/wrangler.jsonc:35`, 3 days kept — gone after 2026-11-03).
   Query them (Cloudflare observability API / MCP `cloudflare` tools) for
   `Could not draw a track` and `Drew a track past failing catalogue paths`
   (`round-conductor.ts:632, 660`) on 2026-10-31 evening. Their presence or
   absence settles the Deezer question; say which in the changelog.
2. **Reproduce the likely failures in a muted browser** (`melee:volume`='0' by
   init script, `docs/browser-driving.md`) — the clip's state can be read from
   the element without hearing it: a 403 / expired MP3 URL (route the CDN request
   to a 403 in Playwright), a stalled load, a wall reload mid-evening, an
   `audioUrl` missing on the wall as speaker.
3. **Fix whatever step 1–2 shows is broken**, on sight.
4. **Say it on screen — Adrien's ask, and right.** A clip that errors, stalls,
   or does not advance within a couple of seconds of its start is a *silent
   clip*: the speaker screen says so, and — since the speaker is often the wall
   the host is not looking at — the speaker reports it to the server
   (a new frame; `realtime-protocol` rule for adding one) so the **console**
   shows it too, with what to do (retry the clip, skip the track, check the
   wall's sound). A Deezer refusal keeps its own message
   (`music_source_unavailable`), worded so the host knows it is the catalogue,
   not their speakers. Strings in both dictionaries; existing ones at
   `dictionary-en.ts:194-205`, `:478`.
5. UI: `impeccable` first; verify the warning on console and wall, at phone
   width when the console is a phone, muted.

## Done when

The cause of the brother's evening is named (or the logs say why it can't be),
a silent clip is told to the console and the speaker, server tests for the new
frame (tag `[audio]` or the repo's), `pnpm validate` green, CHANGELOG, this file
deleted, pushed.
