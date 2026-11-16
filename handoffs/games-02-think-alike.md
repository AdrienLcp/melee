# Pense comme la table — one motion touch left on the narrow console

<!-- cspell:words PILEREGROUP NOSHOOT PAYDIGITS yaour -->

Asked by Adrien on 2026-11-12. Every choice is weighed by what is more fun at
the table, never by what it costs to build.

**The game is done** (16/11/2026): served, on the shelf, dealing the evening's
own prompts — [`docs/plans/70-think-alike.md`](../docs/plans/70-think-alike.md)
holds the rules as settled. `4a9d78cf` (17/11) fixed the three motion faults
this file listed: piles trading places pass one over the other
(`useRowsTravel`'s `arcsWhenPassing`), the narrow console's regroup travels
at all (`isOrderedByStyle` — it never ran there, the piles reverse their CSS
`order`), and the pay pill glides through a digit change
(`useSizeGlideOnSwap` landing on `auto`). Start with the `impeccable` skill.

## This session

1. **Narrow console, seated, 390×844: a brush at the end of a vertical
   trade.** Merging _fromage_ into _beurre_ sends _beurre_ (8) up over _Lait_
   (7). Around 530 ms of the film, as _Lait_ settles under it and its pale
   fades back, its `+26` pill touches _beurre_'s last name for about two
   frames. Tuning lives in `arcOf` in
   `apps/game/src/presentation/components/use-rows-travel.ts`
   (`PASSING_UNDER_PALE_HOLD`, `PASSING_UNDER_DIMMED`); the under row could
   also hold back a little (a short delay on its travel) so the climber has
   cleared before it lands. Film it with
   `SEATED=1 PILEREGROUP=390x844 EVERY=2 FROM=0 QUICK=1 NOSHOOT=1 node .playwright-mcp/ta-console.mjs`
   → `.playwright-mcp/tc-film-seated-alone-console-390-pile-merge.png`.
2. Film the 1440 trade once more after any change
   (`PILEREGROUP=1440x900`, same flags), then the changelog line if the fix
   is visible, push, and delete this file with its row in `README.md`.

## Context

- **Harness flags added on 17/11** (git-ignored `ta-console.mjs`):
  `FROM=<s>` starts the crop sheet earlier (default 0.1 s, which missed a
  regroup that lands fast); `PAYDIGITS=1` with `PILEREGROUP` merges
  _yogourt_ into _fromage_ (+9 → +13) and prints the pill's width per frame;
  each probe line now carries `TRAVEL<n>` (running `rows-travel`
  animations) and every pile's `^top`. A probe line is long — print the part
  from `| yaour` on, never `cut` the head of it (a truncated line looked like
  an empty box once).
- **Harnesses** (all muted by init script, protocol 76): `ta-run.mjs`,
  `ta-console.mjs`, `ta-shelf.mjs`, `ta-shelf-dark.mjs`. They read `PORT`.
- **Another session may hold 3100**: run your own pair on other ports —
  `wrangler dev --port 3200 --inspector-port 9330 --persist-to <long path>`
  and `VITE_SERVER_ORIGIN=http://localhost:3200 VITE_DEV_PORT=5373 vite`.
- **Subagents of 14–16/11 each passed 180–230k tokens** even when capped
  lower: give each one job only.
