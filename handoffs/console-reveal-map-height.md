# The console's Atlas reveal map is a thin strip

Seen while verifying the Atlas reveal on 2026-11-01. Nobody reported it; the
session that saw it was asked to fix it.

## What was measured

- Host console at 1920×1080, **beside a paired wall**, an Atlas reveal with
  five seats: the map's frame (`.world-map svg.surface`) was **840×154 px**
  for three result rows, 224 px for one. At 608×1080 (9:16) it was 164, 164,
  136 and 223 px. Its height follows the results list under it.
- At 840×154 a reveal of Europe plus a pawn in Brazil needs 352 map units of
  height, so the view spans 1920 units across: the 1000-unit world sits in the
  middle of a strip of empty ocean. The framing (`framedOn` with `leastSpan`,
  `world-map.tsx`) is right; the frame is what is too short.
- **Not measured: the console with no wall.** That console is the room's
  screen too, which changes the rule (below). Measure it first.

## The rules it answers to

`.claude/rules/screen-roles.md`: the console beside a wall is one person's
control panel and may scroll; the console with no wall may scroll too, but
what the room reads — the round's podium, the head of the standings, the
next-round press — sits in the first viewport. The map is part of the
round's answer.

## Where to look

- `features/host/reveal-panel.tsx` / `.sass` (`MapReveal` at about
  `reveal-panel.tsx:359-365`), `features/host/host-console-page.tsx` (the
  reveal at about `:776` and `:836`), `presentation/components/map-reveal.sass`.
- `apps/game/DESIGN.md`, the Atlas notes (search *Atlas keeps the console's
  own upright column, its map first*).

## Done when

- The console's reveal map keeps a usable height — a floor or an aspect it
  never drops under — at 16:9 and 9:16, with and without a wall, at
  `MAX_PLAYERS_PER_ROOM` seats with long names, in French; what the room reads
  still sits in the first viewport where the role demands it.
- `impeccable` first: it is a layout change.
- Muted browser and a forced Atlas round, as in `round-row-distance.md`.
- Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
  `-- <paths>`, push.
