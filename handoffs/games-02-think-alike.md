# Pense comme la table — three motion faults left on the console

Asked by Adrien on 2026-11-12. Every choice is weighed by what is more fun at
the table, never by what it costs to build.

**The game is done** (16/11/2026): served, on the shelf, and dealing the
evening's own prompts — read
[`docs/plans/70-think-alike.md`](../docs/plans/70-think-alike.md) for the rules
as settled. What is left was seen on the films of the last screens session and
never fixed. Start with the `impeccable` skill: all three are motion.

## This session

1. **Two piles trading places on the console slide across each other** for
   about a quarter of a second, cards and names overlapping as they pass.
   Seen in `.playwright-mcp/ta-console.mjs` with `REGROUP=1` (a merge that
   reorders the piles, smallest first). Files: `think-alike-piles.sass`,
   `think-alike-sorting.sass` and their components in
   `apps/game/src/features/host/`. A trade must read as two piles changing
   seats — one lifts or fades while the other moves, or both arc — never a
   collision.
2. **A regroup that changes the pay's number of digits (+9 → +13) steps the
   pill's width** by one character instead of easing. The pay pill is the
   one `8b63ead2` kept on screen through a regroup; its width has to ease
   with the digits (`interpolate-size` / a measured width, as other pills
   in `sass-architecture` do).
3. **Not filmed since `8b63ead2`: the console at 390 px wide, seated.**
   `SEATED=1 node .playwright-mcp/ta-console.mjs`, with a regroup, full room
   (24 seats, long names).

Film each fix before calling it done (`docs/browser-driving.md`, _Filming a
motion_), muted, full room, then the changelog line, push, and delete this
file with its row in `README.md`.

## Context

- **Harnesses** (git-ignored, all muted by init script, protocol 76):
  `.playwright-mcp/ta-run.mjs` (a paired wall, a regroup, a wall film at
  either size), `ta-console.mjs` (seated or not, with or without a wall, a
  resize, the rows and piles films — the flags are at its top),
  `ta-shelf.mjs`, `ta-shelf-dark.mjs`. They read `PORT`.
- **Another session may hold 3100**: run your own pair on other ports —
  `wrangler dev --port 3200 --inspector-port 9330 --persist-to <long path>`
  and `VITE_SERVER_ORIGIN=http://localhost:3200 VITE_DEV_PORT=5373 vite`.
- **Subagents of 14–16/11 each passed 180–230k tokens** even when capped
  lower: give each one job only.
