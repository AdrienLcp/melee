# New game — Pense comme la table, step 4: the evening's own prompts

Asked by Adrien on 2026-11-12. Every choice is weighed by what is more fun at
the table, never by what it costs to build.

**Steps 1 to 3 are done** (16/11/2026): the game is served, has its screens,
its console setup (language, 10/20/60 s) and is on the shelf with its front
door and a place in _Mêlée générale_. Read
[`docs/plans/70-think-alike.md`](../docs/plans/70-think-alike.md) first — the
rules as settled and what each step decided beyond them.

## This session: step 4 of the plan

An evening can carry its own prompts, the way a challenge or a _most likely_
deck carries its own lines ([`68-evening-content.md`](../docs/plans/68-evening-content.md),
session 3 is the pattern to copy):

1. **`ownPrompts` on the game's settings arm** (`packages/protocol/src/think-alike.ts`):
   the host's own prompts, dealt by the server before the bank, in the order
   the other games with own lines use. Step 2 left it out on purpose so no
   setting existed that nothing read.
2. **The MCP** (`apps/server/src/infrastructure/mcp/evening-tools.ts`): an
   evening built by Claude can fill them; `describe_games` gains Think
   alike's note — what makes a good prompt (an obvious answer and a few
   runners-up, so a table of eight splits five, two and one; never a prompt
   with one right answer, never one with fifty).
3. **The console's setup** shows and edits them if the other own-lines games
   do (check how challenge / most likely expose theirs), muted, filmed, full
   room.
4. Plan 70 marked done, the changelog, push, and this file deleted with its
   row in `README.md`.

## Seen on the last films, not fixed

- On the console, two piles trading places slide across each other for about
  a quarter of a second, cards and names overlapping as they pass.
- A regroup that changes the pay's number of digits (+9 → +13) steps the
  pill's width by one character instead of easing.
- Not filmed after `8b63ead2`: the console at 390 px wide, and seated.

## Context & decisions

- **Out of the word-game family** in `packages/core/src/room/spaced-cycle.ts`
  (`wordSheets`): a ninth word entry in _Mêlée générale_ left the dealer no
  spaced order. If a later change wants it back, trim another word game's
  entries rather than the family's spacing.
- **Harnesses** (git-ignored, all muted by init script, protocol 76):
  `.playwright-mcp/ta-run.mjs` (a paired wall, a regroup, a wall film at
  either size), `ta-console.mjs` (seated or not, with or without a wall, a
  resize, the rows and piles films — the flags are at its top),
  `ta-shelf.mjs` (shelf, front door, 24 seats to the console reveal),
  `ta-shelf-dark.mjs`. They read `PORT`.
- **Another session may hold 3100**: run your own pair on other ports —
  `wrangler dev --port 3200 --inspector-port 9330 --persist-to <long path>`
  and `VITE_SERVER_ORIGIN=http://localhost:3200 VITE_DEV_PORT=5373 vite`.
- **Subagents of 14–16/11 each passed 180–230k tokens** even when capped
  lower: give each one job only, and hand off rather than chain.
