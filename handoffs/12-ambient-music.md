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
  a few minutes each, shuffled, never the same twice running, each fading into the next),
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

## Progress (24/11/2026, first session — branch `12-ambient-music`, worktree `C:/git/wt-12-ambient-music`, not pushed)

Built and tested, typecheck green:

- `settings.playsMusic` (protocol, default on) — the wall reads it with the
  rest of the settings, and the host's setup remembers it like any room-wide
  setting. `isEveningSilent` now takes it: an evening with music is not
  silent, so a wall offers its sound press in the lobby.
- `packages/core/src/room/ambient-music.ts` — `ambientMoodOf`: `calm` /
  `lively` / `final`, or `null` (give way) when off, paused, a sound check, a
  blind test round from its countdown to its reveal, and Inner clock's count.
  **Decided: the reflex race and Lights keep the music** — their flip and
  their lights fall at random, so a beat tells a press nothing. Tested, broken
  once.
- `apps/game/src/presentation/audio/ambient/` — generative music on the cue
  context, no file and no licence: `theory.ts`, `instruments.ts`, `piece.ts`,
  five styles in `styles/`, `ambient-player.ts` (pieces of 2–3.5 min, each a
  fresh key, tempo and progression, crossfading; the bus fades down with a
  0.45 s time constant and back up with 1.4 s; pieces let go once silent) with
  `ambient-player.test.ts` (fake fader, broken once), and `soundtrack.ts`, the
  lazily-imported chunk that binds the chosen style — **lounge as a
  placeholder until Adrien picks**.
- `presentation/audio/ambient-music.ts` — `useAmbientMusic`, mounted on the
  console (when it is the speaker) and the wall (`speakingView`), at
  `volume × MUSIC_SHARE` (0.35). Any `pointerup`/`keydown` on the page unlocks
  the cue context, so a reloaded speaker resumes on the first touch.
- `RoomActions.playsMusic` / `setPlaysMusic` reported by the console (null
  elsewhere) — **the menu switch itself is not drawn yet**.

Left, in order:

1. **Adrien's pick.** Candidate page:
   `C:/Users/AdrienLacourpaille/AppData/Local/Temp/claude/9442010d3e26fb24/e546e1df-d18d-4d1c-991f-57f856cbc779/scratchpad/candidates/`
   (`index.html` + `entry.ts`, bundled to `candidates.js` with
   `node_modules/.pnpm/esbuild@0.28.2/.../esbuild entry.ts --bundle --format=esm`
   run from `apps/game`). Serve it with
   `python -m http.server 5297 --bind 127.0.0.1` from that folder and give
   Adrien `http://127.0.0.1:5297/` (his own browser). Styles: Salon jazz
   (`lounge`), Lo-fi (`lofi`), Dérive (`drift`), Terrasse marimba
   (`marimba`), Arcade (`arcade`). Offline renders (no sound) measured every
   style at rms 0.03–0.11, peaks ≤ 0.56. Once picked: bind it in
   `soundtrack.ts`, delete the four other style files.
2. The menu switch (`app-menu-leaflet.tsx`, under the room volume slider,
   console only): `Switch` bound to `playsMusic` / `setPlaysMusic`, its label
   in the three dictionaries (`preferences.music`). Start with `impeccable`.
3. The wall gives way during its own sound check too (`useWallSoundCheck`
   does not report `isTesting`; the console's sound check already does).
4. Browser pass, muted (`melee:volume` `'0'` by init script), full and
   filmed: lobby → blind test → quiz → inner clock → final board, a pause, a
   reload, the switch off, a paired wall as speaker. At volume 0 the bus stays
   at 0 by construction, so check the ambient chunk loads, no console error,
   and the switch's motion; the fade logic is the unit test's.
5. Changelog, plan record, CLAUDE.md (_Host_ / _Wall_: the speaker also plays
   the soundtrack), delete this file and its README row, rebase, `pnpm
   validate`, `git push origin HEAD:main`.
