# Motion, part 2 — the floor cuts in and out

Found while filming part 1 (2026-11-09), quiz in _First to buzz_ with two
seats: the host judging a buzz _Wrong_ swaps the verdict panel for the
question in one frame on the console (21550ms → 21566ms on the film), and
the wall does the same. CLAUDE.md rule 0 calls that a bug. The entry into
`buzzed` was not filmed; it is likely the same cut the other way.

## What part 1 settled

- A round's entry after its countdown is `data-round-dealt` on the page
  (`presentation/use-round-dealt.ts`), true from the first `playing` frame
  after a `countdown` frame of the same round until the phase changes. It
  stays false on `buzzed → playing` on purpose: the whole screen must not be
  dealt again there. Whatever this part adds must not re-deal it either.
- On the console and the wall, `RoomStage` (`features/host/room-stage.tsx`)
  returns `PlayingStage` at `playing` and a bare `div.stage.solo` holding
  `VerdictPanel` at `buzzed`: different component types, so the stage node
  remounts at each change and nothing on it plays. The player's buzzer area
  (`player-round.tsx`) keeps its node.

## Where to look

- The verdict panel already enters with a key on the buzz
  (`key={round.activeBuzz.atServerTime}`); check whether it has an entrance
  at all, and give the panel a way out (a leaving state ended when
  its exit animation ends, `react-components.md`) or a `replaceScreen` around the
  frame — weigh the view transition against a press landing during it,
  since the race reopens the moment the floor is released.
- The question coming back should read as _the same round resumed_, not a
  new one: a fade of what changed, never `page-lay`.

## Done when

The floor taken and handed back are filmed on console, wall and player
(`docs/browser-driving.md`, _Filming a motion_), nothing cuts, nothing deals
the round again, then pushed. Delete this file and its README row.

## Driving notes

Part 1's script is the quickest start: a Node file on the repo's
`@playwright/test` (`createRequire('C:/git/melee/package.json')`), headless
with `--mute-audio`, contexts in `en-US` (the join form reads _Nickname_
only in English), `melee:volume` set to `'0'` in the init script, a
`MutationObserver` logging each `.stage` / `.player-round` mount with its
`getAnimations()` names, and a CDP screencast per page laid out on a
contact sheet. The host opens a room from `/en` (_Untick all_, the game's
spine, _Open a table_), seats join at the console's `.join-url`, the wall is
a second tab of the console's context at `/wall/<code>`, and _First to buzz_
is picked under the Games tab's planned row. Servers on your own ports:
`pnpm exec wrangler dev --port <p> --inspector-port <i> --persist-to <scratch>`
in `apps/server`, `VITE_SERVER_ORIGIN=… VITE_DEV_PORT=… pnpm exec vite` in
`apps/game`.
