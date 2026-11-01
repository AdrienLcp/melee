# The round's podium cuts an Atlas distance to « à… » on a phone

Seen while verifying the Atlas reveal on 2026-11-01. Nobody reported it; the
session that saw it was asked to fix it.

## What was seen

- Player page at 390×844, French, an Atlas reveal (Belgium, three pawns round
  Paris), seats named with 18–20 characters.
- In *Cette manche* (`round.thisRound`), the **first** row is the large one:
  `1 · pawn · Anne-Charlotte Dupré · à.. · 20 +19`. The distance is cut to
  `à..`. The smaller rows below print it whole: `à 178 km`, `à 177 km`.
- So the first place's name, at the podium's larger size, takes the room the
  distance needs. The distance is the one figure the round paid for — it is
  what has to stay whole; the name is what can give way.

## Where to look

- `presentation/components/round-podium.tsx` and `.sass` (the podium rows),
  `presentation/components/use-distance-words.ts` (the `à 298 km` words),
  `features/player/player-round.tsx` / `.sass` (the player's round block).
- `.claude/rules/screen-roles.md`: the player's first viewport owes the
  round's block; at `MAX_PLAYERS_PER_ROOM` seats with long names, at phone
  width, in French.

## Done when

- At 390×844 and at the narrowest phone `e2e/choice-fits.spec.ts` lists, the
  first row prints its distance whole with a 20-character name; the name is
  what ellipses.
- The wall and the console keep what they print today.
- `impeccable` first: it is a layout change.
- Muted browser (`docs/browser-driving.md`). An Atlas round can be forced by
  temporarily replacing `drawCountry({ playedIds })` in `drawTargetOf`
  (`apps/server/src/infrastructure/messaging/round-conductor.ts`) with a fixed
  **alpha-3** code (`'BEL'`), reverted with an exact edit afterwards; pawns go
  in through raw sockets as `{ latitude, longitude }`.
- Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
  `-- <paths>`, push.
