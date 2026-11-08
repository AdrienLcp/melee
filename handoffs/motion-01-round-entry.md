# Motion, part 1 — the round cuts in after the countdown

Found while filming black square (2026-11-08): when the countdown's last
token fades, the round's stage is there at once, in one frame, on the
player's screen and on the wall. CLAUDE.md rule 0 calls that a bug.

## What the films showed

- **Player**, black square at 4 cells: the `0` token greys out at 3207ms, and
  at 3240ms the theme card, the four cells and the field are all drawn at full
  opacity. Nothing travels.
- **Wall**: the `0` fades at 3120ms, and at 3170ms the theme card, the gauge
  and the answered pawns are all there.
- The reveal is fine on both (the reveal panel's `card-strike`), and so is the
  countdown itself (`countdown-strike`).

## Where it comes from

No screen animates the stage a round opens on. `host-console-page.sass`
animates the header's additions (`swap-in`), a paused card and the
next-game recap (`page-enter`), never `.stage` at `playing`. On the player,
`player-round.tsx` swaps the countdown's `<section>` for the round's with
nothing to wrap it; only higher-lower's `.pair` enters (`pair-dealt`). So
this is likely every game, not black square: film a quiz and a blind test
round first to confirm before writing anything.

## The trap

A rule keyed on the stage's phase class re-runs whenever the class comes
back: a round goes `playing → buzzed → playing` on a wrong buzz, and a
`.stage.playing > *` entry would re-deal the whole screen there. The entry
belongs to the change from countdown to round, once per round — a key on the
round, a leaving state on the countdown (`react-components.md`, _A state
derived during render_), or a view transition (`replaceScreen`) — not to the
phase.

## Done when

Every game's round enters with a motion on host, wall and player, filmed
(`docs/browser-driving.md`, _Filming a motion_), a wrong buzz returning to
`playing` filmed too and moving nothing, then pushed. Delete this file and
its README row.

## Driving notes from the black-square session

- The Playwright MCP browser can be held by another session ("Browser is
  already in use"). A Node script on the repo's `@playwright/test`
  (`createRequire('C:/git/melee/package.json')`), headless with
  `--mute-audio` and the `melee:volume` init script, does the same job; a
  dev server on your own ports is
  `pnpm exec wrangler dev --port 3117 --inspector-port 9337 --persist-to <scratch>`
  in `apps/server` and
  `VITE_SERVER_ORIGIN=http://localhost:3117 VITE_DEV_PORT=5287 pnpm exec vite`
  in `apps/game`. `npx` under Git Bash resolves the wrong bin path.
- A raw-socket seat's nickname is at most 20 characters
  (`NICKNAME_MAX_LENGTH`); a longer one is a non-fatal `too_big` refusal.
- A screencast sends a frame only on change: keep every frame of the window
  around the countdown's end, never one in fourteen, or a cut and a 250ms
  move look alike.
