# Bundle budget, part 1 — guard the path a player joins by, not the home page

## Why

On 12/11/2026 the Lighthouse job went red on `resource-summary:script:size`
(`lighthouserc.json`, one 300 000-byte cap on every URL): `/en` had grown from
298.9 kB to 336.3 kB. `3c28a89a` brought it back to 299.2 kB — **0.8 kB of
margin**, so the next addition to the home page turns CI red again.

Adrien asked whether a game app needs to be light. The answer that shapes this
session: **weight costs once, on arrival, and the arrival that matters is a
player scanning the QR code** on a mid-range phone over 4G or a venue's Wi-Fi,
while the table waits. Once in, the room runs on the socket and loads nothing
more. On a phone the cost is mostly parse and execute time, not bytes.

## What is wrong with the guard today

- **It measures the wrong pages.** `collect.url` lists `/en`, `/en/blindtest`,
  `/en/credits`, `/en/legal`. The player's route, `/play/:roomCode`
  (`apps/game/src/infrastructure/router/navigation.ts:79`), is not measured at
  all, so the path that must be lightest has no budget.
- **One cap for every page.** The home page and the legal page get the same
  300 kB as the join path would, so a feature on the front door trips a
  budget meant to protect players.

## To do

1. **Measure first.** Build, then run Lighthouse the way CI does
   (`pnpm lighthouse`, `.github/workflows/ci.yaml` job `lighthouse`) and record
   the script payload of every route, including `/en/play/<code>` for a room
   that exists and one that does not. A `/play` page needs a live room to load
   past its lobby: find out what it shows without one, and whether
   `startServerCommand` can open a room first (an HTTP `POST /api/rooms`
   before collection), or whether the measured page is the join form.
2. **Split the assertions per route** with LHCI's `assertMatrix`
   (`matchingUrlPattern` per entry): a tight cap on the player's arrival, set
   just above what step 1 measured, and a looser one on the front door. Decide
   the numbers from the measurements, write the reason for each beside it.
3. **If the player's path is heavy, slim it** (lazy-load what a player sees
   only later — reveals, menus, game screens of games not being played) before
   setting its cap. Moving code to its own chunk follows `3c28a89a`'s pattern
   (`menu-seat-rows.tsx`).
4. Document the budget's intent in `docs/` (where CI's checks are described)
   so the next red Lighthouse run is read as "which path grew", not "raise
   the cap".

## Verify

- `pnpm lighthouse` green locally, and the CI `lighthouse` job green after the
  push.
- Break it on purpose once: add a few kB to the player's route and watch its
  assertion, and only its, go red.
- Any change to what loads when: check the screens in a real browser, muted
  (`docs/browser-driving.md`) — a lazy chunk must not make a screen appear
  without its entrance motion.
