# 78 — Ambient music

**Done** 24/11/2026 — two sessions, from handoff 12.

Adrien, 23/11/2026: a little ambient music, cut while a blind test track
plays, because the mood drops sharply after a blind test — and heard very
often, so it must not be monotonous. 24/11/2026, after hearing five
candidate styles: keep them all, a random one by default, any one choosable.

## Shape, as settled

- **Generated, not files.** Five styles written on the cue context
  (`presentation/audio/ambient/`: `theory.ts`, `instruments.ts`, `piece.ts`,
  `styles/`), so no licence, no third-party request and no download beyond a
  lazily-imported chunk (`soundtrack.ts`) fetched once the speaker's audio
  runs. A piece lasts two to three and a half minutes, each a fresh key, tempo
  and progression, the next fading in over the last's outro.
- **One setting**, `settings.soundtrack`: `off`, `mix` (the default) or one of
  `lounge`, `lofi`, `drift`, `marimba`, `arcade`. `nextSoundtrackStyle` draws
  each piece's style under `mix`, never the one just played, so the crossfade
  also changes band; a style picked while another plays crossfades in at once
  (`crossfadeNow`) instead of waiting for the outro. Remembered with the
  host's setup like every room-wide setting, and an evening with music is not
  silent, so a wall offers its sound press in the lobby (`isEveningSilent`).
- **The speaker alone**, at the room volume times `MUSIC_SHARE` (0.35), under
  the clip. `ambientMoodOf` gives a mood — calm, lively around a reveal, final
  under the last board — or `null` to give way: off, paused, a sound check on
  the console or the wall, a blind test from its count in to its reveal, and
  Inner clock's count. **The reflex race and Lights keep the music**: their
  flip and their lights fall at random, so a beat tells a press nothing.
- **Fades, never cuts**: the bus goes down with a 0.45 s time constant and
  comes back with 1.4 s; pieces under a silent bus are let go.
- **The menu's _Music_**, a `Select` under the room volume, on the console
  alone: _None · Random · Jazz lounge · Lo-fi · Drift · Marimba terrace ·
  Arcade_. A closed list of seven is too long for a strip.

## Verified

Unit tests on the moods, the per-piece draw, the player's fades, crossfade
and let-go, each broken once. Browser pass at volume 0: a console at phone
width with 24 long-named seats, the select's opening filmed, the pick kept
across a reload, a paired wall as speaker loading the soundtrack on its sound
press, a quiz paused, revealed and ended on the final board, then _None_ —
no console error. At volume 0 the bus stays silent by construction, so the
ducking itself is the unit tests'; a blind test and Inner clock were not
driven in the browser.
