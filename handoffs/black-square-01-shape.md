# Black square, part 1 — the screens at four cells

The engine landed in the commit "Deal black square four answers from a pool,
and give it a level": a theme is a pool of 12–20 tiered answers, a round deals
`answerCount` of them (default 4: one easy, two medium, one hard,
`packages/core/src/blacksquare/answer-deal.ts`), each cell carries its own
tier (`cellTiers` on the view and on the verdict, replacing `answerCount` /
`cellCount`), and the room's `difficulty` picks the theme. Five authored pilots
sit in `apps/server/src/infrastructure/questions/black-square-authored.json`,
the Wikidata bank is cut to 61. Protocol, core and server are tested; the app
compiles and its tests pass. **Nothing of it has been seen in a browser** —
that is this session.

## What Adrien asked (2026-11-08)

> Pour cases noires je me demande si mettre juste 4 réponses à trouver ça
> suffirait pas. On garde le principe du mot noir.

## The work

1. **`impeccable` first** (CLAUDE.md rule 1): a grid of four is now a diamond
   — one easy cell on the top row, two medium, one hard
   (`apps/game/src/helpers/black-square-cell-place.ts`, one row per tier, a
   short row centred). Judge whether that reads well on the host stage, the
   wall and the player sheet, or whether four cells want another layout. At
   eight or nine cells the medium tier holds four or five, more than a row's
   three: cells then fall three per row in cell order and the pips alone say
   the tier — check it does not look broken.
2. Drive it muted (`melee:volume` `'0'` before the first navigation,
   `docs/browser-driving.md`), on a dev server started by this session on its
   own ports: a typed room at 4 and at 9 cells, a spoken room (keeper list at
   4), the reveal, the difficulty picker in the black-square settings, `easy`
   dealing one of the five pilots. Full room (`MAX_PLAYERS_PER_ROOM` long
   names) at phone width.
3. Film the round entering and the reveal (rule 0, _Filming a motion_).
4. Fix what the screens show, then commit with `git commit -F msg -- <paths>`
   and push once CI is green (`push = prod`).

## Known edges

- A room stored mid-round across the deploy holds a verdict with `cellCount`
  and no `cellTiers`; the room object does not re-parse round content. A black
  square round open at deploy time would break its view until the next round.
  Rare; decide whether a guard is worth it.
- The higher-lower test `[difficulty] holds France on one side…` was red in
  the shared tree from the difficulty-04 session's work in progress, not from
  this series.

## Done when

The four-cell grid has been seen and filmed on host, wall and phone, at full
room and phone width, and pushed. Then delete this file and its README row.
