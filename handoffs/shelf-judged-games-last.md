# The home shelf: the games a host judges go last, under their own heading

> « Au passage, je trouve ça étrange sur la page d'accueil d'avoir les 3 jeux
> non cochés par défaut en plein milieu. On devrait pas les mettre à la fin ? »

He approved the direction below. **`impeccable` first** (global rule 1): this
is a layout change on the front door. The direction is decided. The exact look
of the heading is `impeccable`'s call.

## What the triage verified

- **The default ticks**: a device that never ticked anything opens on the
  first ready-made line-up's games (`useShelfTicks`,
  `apps/game/src/features/home/use-shelf-ticks.ts`). Since `58e739fe` that is
  the Grand mix: every game no host judges (`UNJUDGED_GAMES`, which filters on
  `isJudgedInEveryMode` from `@melee/core/room/game-modes`).
- **The three unticked cards** are `slate`, `buzzer` and `challenge`, the games
  judged in every mode. In `shelvedGames` (`packages/protocol/src/game.ts:58`)
  they sit at positions 3, 5 and 7, which breaks the run of ticked cards three
  times. They read as misclicks, not as a different kind of game.
- **`shelvedGames` order has other readers**: the home shelf
  (`game-shelf.tsx:75`), the lobby's picker (`features/host/game-pick-list.tsx:47`),
  the prerendered game pages (`entry-server.tsx:70`) and a note in
  `infrastructure/router/navigation.ts:43`. Its JSDoc (`game.ts:54-56`) says
  sorting it is a product change.

## Decided

1. **On the home shelf, the unjudged games come first and the judged ones last**,
   under a small heading that names them, e.g. « Avec un arbitre » /
   "With a referee". The wording is open: it must say the host judges or brings
   the content, in the voice of `.claude/rules/i18n.md`, without naming a device
   or reciting the setup. An unticked card then reads as another kind of game,
   not as a forgotten box.
2. **Derive the groups from `isJudgedInEveryMode`; don't hand-reorder
   `shelvedGames`.** Each group keeps `shelvedGames` order inside it, so a
   future judged game lands in the right group on its own, and the "reach for
   first" order stays the product's. Reorder the constant only if the lobby's
   picker turns out to need the same order and grouping there is worse. Check
   whether the picker is a tick list facing the same problem, and decide.
3. **No sorting by tick state.** The cards would jump under the finger on
   every press.

## Verify

Muted browser (`docs/browser-driving.md`), French and English, both palettes,
at 390×844 and 1440×900, on a first visit (no stored ticks) and with stored
ticks that mix both groups. Grep the e2e specs for anything that relies on
card order (`game-shelf`, `nth(`) and keep them green.

Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
`-- <paths>`, push.
