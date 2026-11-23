# Blind test « Flash »: a mega-hit, heard for one second

Starts once `01-replay-and-ready.md` has landed (both touch the line-up's
entries). Read `README.md`, then `docs/plans/61-cumulative-track-sources.md`
and `docs/game-catalogue.md` before shaping anything. Mapped read-only on
23/11/2026, lines from `7ded3593`.

Adrien: "a new mode in the blind test: a VERY famous song, a classic everyone
recognises at once, and you hear only one second, or less. That would depend
on the locale, so the culture, I think. I'll let you see. I want it in
Mêlée générale."

## Today

- A source is a `catalogue` (charts / decades / film scores), a `playlist` or
  a `search` (`packages/protocol/src/track.ts:81-180`); a line-up variant is
  `{ ...DEFAULT_BLINDTEST_SETTINGS, homeCountry, source }`
  (`ready-made-line-ups.ts:75-85`); mixing in `deezer-client.ts:487-561`.
- Popularity: Deezer `rank` (~0–1M, "classics sit at 830k–990k",
  `deezer-client.ts:41-56`), floors easy 500k / mixed 250k / hard 50k, filter
  at `:309-317`; Portugal's playlists use `rankShare` 0.2 (`:378`), its tracks
  ranking near 200k (`:353-355`). Rank is dropped after filtering
  (`CatalogueTrack`, `packages/protocol/src/http.ts:125`).
- **`homeCountry === null` falls back to France's playlists**
  (`deezer-client.ts:389-390`): an English table hears French hits. Fix that
  here — `null` means international only, as it does for estimate.
- Clip: `roundDurationMs` 5 000–30 000 (`game.ts:136`); the clip always starts
  at 0 of Deezer's 30 s preview and runs the whole round, scheduled on
  `startsAt` via rAF (`apps/game/src/features/host/round-audio.ts:573-595`),
  two decks preloading the next (`:539-549`), no fade; `seekTargetMs` only
  moves forward and ignores gaps under 750 ms
  (`packages/core/src/blindtest/clip-audio.ts:7-28`). Console and wall both
  play audio.

## Decided

- **A variant of the blind test, not a game**: a source strand "flash" (the
  mega-hits) plus a **clip window** on the settings, separate from the
  round's answer time — the clip plays `clipWindowMs` (default 1 000, a
  setting down to 500) from `startsAt`, then the deck pauses; the round's
  answer time runs on in silence. The reveal plays the track on as today.
  Nothing replays the flash during the round: the game is one hearing.
- **Mega-hits**: a high rank floor (start from ~850k, measured on the
  catalogue so every locale keeps a deep enough pool) over the decades and
  charts, per `homeCountry` like the decades: France's classics for a
  French table, Portugal's for a Portuguese one (its own floor, since its
  ranks run lower), the world's for `null`. Measure pool sizes per country
  and write them in the plan record.
- **Where the second starts**: the preview's first second is often an intro
  or silence. Measure on a sample of previews whether a fixed offset
  (e.g. the preview's 10th second) lands in the recognisable part more
  often than 0; a `startOffsetMs` on the round, applied on both screens and
  after a reload (`seekTargetMs` must accept it), if it does.
- **In Mêlée générale** as one more blind test variant, with the room's
  `homeCountry`; it also serves the International evening (handoff 11) with
  `null`.
- Answer modes as the blind test's. Muted testing is non-negotiable: the
  session never hears the clip, so the window is checked by the deck's
  `currentTime` and pause events, not by ear.

## Done when

A plan file (`docs/plans/77-blindtest-flash.md`) records the decisions and
measures; the window holds on console and wall, after a reload and under a
pause (core tests for the timing helpers, broken once); the variant on the
shelf's blind test setup and in Mêlée générale; `homeCountry` null no longer
deals French hits. Changelog, CLAUDE.md's blind test paragraph, delete this
file and its README row.
