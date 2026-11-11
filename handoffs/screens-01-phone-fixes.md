# Screens 01 — three phone-width defects

Found on 2026-11-11 by the browser check of the uncapped _Free-for-all_
(`e06e03bf`). None comes from that change: each reproduces with a short
line-up. All three are UI work, so the session starts with the `impeccable`
skill, drives a muted browser (`docs/browser-driving.md`) and films every
motion it touches (CLAUDE.md, rule 0).

## 1. The wall scrolls at phone shapes

- The lobby with 24 seats (`MAX_PLAYERS_PER_ROOM`), 20-character names: the
  wall document is 1218 px tall at 390×844, 1224 at 430×932, 1177 at 844×390.
  The seat roster grid runs past the viewport.
- TV shapes are fine (1280×720, 1920×1080, 1080×1920).
- `.claude/rules/screen-roles.md`: the wall never scrolls, at any shape — the
  roster gives way (denser grid, smaller names, or a count) before the page
  does. Read that rule for what gives way first.
- Verify: wall lobby full at the three phone shapes above, no document scroll,
  nothing clipped.

## 2. "Change" on the host console is a cut at phone width

- At 390 wide, pressing **Change** above the running order swaps it for the
  ready-made picker in one frame (no running animation), and picking a
  line-up to go back is a cut too. At 1280 both directions animate
  (grid-template-rows and opacity).
- Same with _Quick game_ loaded: not the line-up's length.
- Find where the narrow layout swaps the two blocks (host evening setup,
  `apps/game/src/features/host/`) and give both directions the motion the
  wide layout has (`sass-architecture`, _A state change moves_).
- Verify: film the swap both ways at 390 (CDP screencast or
  `document.getAnimations()` sampled per frame).

## 3. The fixed Menu button covers row actions at phone width

- At 390, scrolling a long running order, the floating **Menu** (`AppMenu`)
  sits over the rows' "…" action button and the end of their detail text.
- The rows (or the list) need room at the bottom-right where the menu floats,
  or the menu must not sit over interactive content — decide with impeccable.
- Verify: 56-entry _Free-for-all_ loaded, scroll the running order at 390,
  every row's "…" reachable and uncovered.
