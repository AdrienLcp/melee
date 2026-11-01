# Red `pnpm validate`: host console and room e2e journeys

> « Pour réparer les tests, prépare un handoff à faire après les deux
> sessions. »

**Run this after `ready-made-games` and `silent-clip` have both landed** — the
red appeared while `silent-clip` had uncommitted edits in the tree, and both
sessions touch the host console.

## What was seen (2026-11-01, local, not CI)

- `pnpm validate`: 35 e2e passed, **26 failed** — every failure a host console
  or room-stage journey, plus the Atlas name round. The player and wall
  full-table reveal journeys in `e2e/choice-fits.spec.ts` pass.
- They fail run alone too (`room, countdown`, `room, reflex, the wait`), so it
  is not a flake.
- Browser console during the failures: *"Should have a queue. You are likely
  calling Hooks conditionally"* and *"I18nProvider was read outside of its
  provider"*.
- `pnpm dev` died the same morning with `Uncaught ReferenceError:
  clipFaultSchema is not defined` in the Worker bundle — a protocol schema
  referenced before it existed, mid-edit.

## Where to look first

The tree then held `silent-clip`'s uncommitted work on exactly the failing
surfaces: `host-console-page.tsx`, `room-stage.tsx`, `clip-offer.tsx`,
`round-audio.ts`, `wall-page.tsx`, `wall-view.ts`, `use-wall-connection.ts`,
the server's `room*.ts` and `socket-handler.ts`, `packages/protocol/src/sound.ts`
and `room.ts`. A hook called conditionally in one of the console components is
the likely cause; a new provider-less render path (a report or notice drawn
outside `I18nProvider`) the likely second.

1. `git log` since `c599c757` — see what landed and whether it still fails.
2. Run one failing journey alone (`pnpm test:e2e -g "room, countdown"`, after a
   build — `.claude/rules/e2e.md`), read the first console error, fix at the
   source.
3. Whole `pnpm validate` green, then push (push deploys).

## Unpushed at the time of writing

`9c534cd6` (player reveal held to three lines) and two handoff commits sat
unpushed on `main` because validate was red. Push them with the fix.

## Done when

`pnpm validate` green, pushed, this file deleted.
