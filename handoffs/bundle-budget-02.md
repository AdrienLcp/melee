# Bundle budget, part 2 — slim the player's arrival

## Why

Part 1 (the commit that deleted `bundle-budget-01.md`) measured every path
and put the budget per path in `lighthouserc.cjs`; the intent is in
`docs/architecture.md`, _Why one app rather than two_. The player's arrival —
`/PLAY/<code>`, what the QR code encodes — is the **heaviest** page, not the
lightest:

| Path (12/11/2026, gzip over the wire)         | Script  |
| --------------------------------------------- | ------- |
| `/PLAY/<code>`, live room or none — identical | 432 kB  |
| `/en`                                         | 299 kB  |
| `/en/legal`                                   | 286 kB  |
| `/en/blindtest`, `/wall`, `/invite/<code>`    | 274–278 |
| `/en/credits`                                 | 270 kB  |

Its cap sits at 440 000 so it cannot grow meanwhile. This session brings it
down, then sets the cap **below the front doors'** (330 000), just above what
it then measures.

## Where the weight is

`use-round-dealt-*.js` — 95 kB gzip, 304 kB raw — is loaded on arrival. It
holds every game's answer and reveal screens and the libraries only they use:
react-aria drag and drop (~40 kB raw, the timeline's order), the colour area
(swatch), the number field and its parser (estimate), `GridList`, `ListBox`,
Petit Bac's sheet, the matchsticks, the word games' keyboards, the black
square keeper. Its name is rolldown's: a chunk shared by the player page, the
console and the wall, named after one hook in it.

They all come in through `apps/game/src/features/player/player-round.tsx`
(1 982 lines), which statically imports every game's components and also
draws the lobby (`view.phase === 'lobby'`, around line 607). A player arriving
sees the name form, then the lobby — none of those screens.

Also on arrival, smaller: `room-invitation` (7.6 kB, `qrcode.react`) and the
menu fetched at idle on a room page (`app-menu.tsx`, `preloadMenu`, ~17 kB
with its rows) — the idle fetch is by design (`06030b1a`), and Lighthouse
counts it when it lands before the run ends.

## To do

1. **A chunk per game** for what `player-round.tsx` draws during a round:
   each game's answer and reveal components behind a dynamic import, the
   lobby, the join form and the shell's reveal blocks staying in the page.
   Check the console and the wall share those components (`grep` the imports)
   — a split that serves the player must not make the console wait either.
2. **Preload the room's games from the lobby**: once a view names the game or
   the line-up (`settings.game`, `settings.lineUp`), import those games'
   chunks, so the countdown never waits on the network. Render a loaded module
   **synchronously** — `React.lazy` suspends one frame even on a cached
   module, which would cut the entrance motion. `app-menu.tsx`'s
   `loadedSeatRows ?? use(loadMenuSeatRows())` is the pattern; a helper owning
   it is worth writing once two places use it. Keep `holdWhileReloading`
   around every import (`infrastructure/stale-build.ts`).
3. **Measure** after each cut with source maps (below), then set the player's
   cap in `lighthouserc.cjs` just above the new figure and update the date and
   numbers in `docs/architecture.md` and the table in this file's place (the
   CHANGELOG entry carries them).

## Measuring

- **Ports are shared.** Other sessions leave `wrangler dev` servers on 3100,
  3110 and 3190 — part 1 measured a stale build for half an hour on 3190. Run
  the server on a port nothing listens on (`netstat -ano | grep LISTENING`),
  e.g. `pnpm exec wrangler dev --port 3277 --inspector-port 9277` in
  `apps/server`, and check `curl -s <origin>/en | grep -o 'main-[^"]*\.js'`
  matches `apps/game/dist/assets/main-*.js` before trusting a figure.
- **Lighthouse on that port**: copy `lighthouserc.cjs` to the scratchpad with
  the origin replaced and the `startServer*` lines dropped, then
  `node --import tsx scripts/lighthouse.ts --config=<copy>`; `lhci assert
  --config=<copy>` re-asserts the same runs with other caps.
- **What a chunk holds**: `pnpm exec vite build --sourcemap --outDir
  <scratchpad>/dist-map --emptyOutDir` in `apps/game`, then attribute each
  byte through the map (part 1 used a 20-line script walking the VLQ mappings
  — rewrite it, it was in a scratchpad).

## Verify

- `pnpm lighthouse` green locally, and the CI `lighthouse` job after the push.
- Every game's round on a player screen in a real browser, muted
  (`docs/browser-driving.md`): the answer screen enters with its motion at the
  countdown, filmed (CLAUDE.md rule 0) for at least the heaviest split
  (timeline, swatch, estimate) and one plain choice game.
- A throttled network (DevTools "Slow 4G") on a player who joins mid-lobby:
  the game's chunk lands before the countdown ends.
