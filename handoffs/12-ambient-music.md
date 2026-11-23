# Ambient music between the rounds

Starts once `08-blindtest-flash.md` has landed (both touch the console's and
the wall's audio, `round-audio.ts`). Read `README.md` first.

Adrien (23/11/2026): "I'd add a little ambient music too — cut while a blind
test track is playing, obviously — because the mood drops sharply after a
blind test." And: "we'll hear it very, very, very often, so it mustn't be too
monotonous, you see what I mean?"

## What exists

- The blind test plays through two decks in
  `apps/game/src/features/host/round-audio.ts` (console and wall), at the room
  volume the console sets, on whichever screen is the room's speaker
  (CLAUDE.md, _Host_ and _Wall_).
- Synthesised cues already run through one shared `AudioContext`, unlocked
  inside a gesture: `apps/game/src/presentation/audio/cue-audio.ts`
  (`unlockCues`, `audibleCueContext`), `timer-cue.ts`, `buzz-cue.ts`, mounted
  by `host-console-page.tsx` and `wall-page.tsx`.

## Decided

- **One speaker**: the music plays on the room's speaker screen only (the
  wall when paired, as the clip does), never on a seat's phone, at the room
  volume times a level of its own below the clip's.
- **It gives way to every other sound**: faded out (not cut — rule 0 holds
  for sound too) before a blind test clip starts, kept down while the clip or
  the reveal's track plays and while the host replays it, faded back in after.
  **Silent during Inner clock's count**: a beat is a metronome, and the game
  is counting seconds in your head. Weigh the reflex race and Lights the same
  way (does a beat help anyone time a press?) and say what was decided.
- **A table setting**, on by default, in the table panel beside the room
  volume; the host's choice is remembered with the rest of the host's setup.
- **Never monotonous**: not one loop. Either a pool of tracks (eight or more,
  a few minutes each, shuffled, never the same twice running, crossfaded),
  or music generated live on the cue context (endless variation, no file),
  or both — a mood for the lobby, another between rounds, the final board
  its own. Adrien chooses by ear: the session builds **one index page** of
  candidate soundtracks he can play side by side, opened for him in the
  built-in browser (`preview_start` with the `file:///C:/...` URL), and
  builds only the one he picks.
- **Licence and privacy**: only music the project may ship — CC0 or a licence
  that allows self-hosting and use in an app, credited on the credits page
  if the licence asks. Files are served by the app itself (no third-party
  request: `.claude/rules/privacy.md`, the /legal page stays true), loaded
  after the audio unlock, within a size budget the session states.
- **Muted testing**: the session never hears it and never plays it aloud.
  `melee:volume` `'0'` before the first navigation as always; the fades and
  the ducking are checked on gain values and element state, and helpers that
  schedule them are tested in core or beside the module, broken once.

## Done when

Adrien picked a soundtrack from the index page; it plays on the speaker
screen from the lobby to the final board, fades under every clip and during
Inner clock, survives a reload and a pause (`host.pause` stops it too), and
the setting turns it off. Changelog, CLAUDE.md where the speaker is
described, delete this file and its README row.
