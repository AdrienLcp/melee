# i — Challenges played off screen

Some of the evening's rounds happen at the table, not on a screen: cut a
vegetable into two halves of the same weight, stack the most raclette potatoes.
The app knows nothing about who won; the host says it, and the points have to
land on the board like any other round's.

Adrien asked for it on 20/10/2026 as a *maybe* for December: build it after f
and before g, so g's pass over the big screens covers its screens too.

## What exists already

- `host.adjustScore { target: team | seat, points }` is accepted **in every
  phase** (no guard in `socket-handler.ts`), floors at zero, and on a track a
  team's adjustment walks its pawn a case per whole `POINT`
  (`apps/server/src/domain/room/team-service.ts`).
- The console offers it in one place only: a − and a + per team under the
  reveal's standings (`TeamMove`, `board-moves.tsx`), a case at a time.
- **A seat's adjustment never reaches its team** — a team is paid by its rounds
  and its own adjustments (the schema's JSDoc). With Teams on, a challenge one
  colleague plays for their team is awarded to the team.

## What to build

1. **A challenge as a game of the line-up** — `challenge`, the bare buzzer with
   no buzz: the host types what the challenge is (one line, capped), the wall
   shows it large while the table plays, and the host then places the teams
   (or the seats with Teams off) — first, second, third. The reveal is the
   scoreline, and the round runs through everything a round already has: it
   counts in `roundCount`, walks the pawns, and the finish rule of step f
   applies on its reveal. Judged by the host, so no seated host under it
   (`isJudgedByHost`). **Shelved like the others** (decided 20/10): a preset's
   `lineUp`, the lobby picker and the reveal's next-game control all read
   `shelvedGames`, so a game left off it cannot join an evening, and a third
   list buys nothing — a table of challenges alone is a real evening too.
2. **Points by hand at any moment** — the escape hatch: a *Points* entry in the
   console's menu (`AppMenu`) listing teams, or seats with Teams off, each with
   − and + by whole `POINT`s, reachable in every phase. It is the same frame the
   reveal's standings send; only the place to press is new.

1 alone covers a planned challenge; 2 alone covers a bonus nobody planned and
a call to correct. If December runs short, 2 ships first: it needs no protocol
change.

## How it is built (mapped 20/10)

- **Paying**: a new host frame, `{ roundId, places: [{ target: team | seat,
  place: 1 | 2 | 3 }] }`, named like the slate's own host frames. Refused
  unless `round.content.kind === 'challenge'` and the round is in play. It
  rebuilds `round.awards` from scratch the way `rescoreSheets` does
  (`apps/server/src/domain/round/slate-round.ts`), each score moving by the
  difference, so a placement can be changed; then it reveals. Every stamped seat
  of a placed team gets `place-pay × POINT` with `{ kind: 'single', isCorrect:
  true }` — the team's mean is exactly that, the pawn walks it, the reveal's
  *walked N* and `bankTeamRound` work unchanged. **Not** `host.adjustScore`: it
  banks at once, so the reveal would show no move.
- **The text** travels on `host.startRound` beside `slateKeys`, lands in
  `round.content { kind: 'challenge', text }` on all three views (public — it
  is no answer).
- **The compiler flags**: `DEFAULT_GAME_SETTINGS`, `roundDurationMsOf` (null),
  `capabilitiesOf` (as buzzer: no team turns, no wall answers),
  `DEFAULT_ROUND_COUNT` / `DEFAULT_ANSWER_MODE` / `DEFAULT_HOLD_MS`,
  `beginRound` in `round-conductor.ts` (open with no fetch, beside buzzer),
  `toHostContent` / `toContentView` in `room-view.ts`, `holdsTheAnswer`,
  `candidatesIn`, the scoring switch and `gameNameKey` in the app's i18n,
  `GAME_GLYPHS`, `PAGE_HEADS`.
- **It does not flag**: `gameKinds`, `shelvedGames`, the three
  `roundContentSchema`s, `PROTOCOL_VERSION` (bump to 30),
  `HOST_ONLY_MESSAGE_TYPES`, `isJudgedByHost`, `registerBuzz` (refuse a buzz in
  a challenge), `toWallContent` and `withheld` (`default`), `PlayingStage`'s
  line, `RoundActions` (where *place* goes), `settings-panel.tsx` (hide the
  answer window and lockouts), the player's fall-through to `<Buzzer>` in
  `player-round.tsx`, the spine tokens and their contrast test, the home
  descriptions in `document-head.ts`, the Christmas preset, and the hand-made
  views in `e2e/choice-fits.spec.ts`.
- **Points in the menu**: `AppMenu` holds no view and no socket. Add a field to
  `RoomActions` (`presentation/room-actions/room-actions-provider.tsx`) —
  teams, players, board and an `adjust(target, points)` — reported from
  `host-console-page.tsx` in a `useCallback`, rendered as a `Disclosure` the way
  `SeatName` is. The rows reuse `TeamRoster`'s `teamAction` / `seatAction`
  slots. Today a board that is off leaves the host no adjust control at all,
  and no screen ever sends a seat target.



Settled 20/10/2026: the host places up to three, paid 3, 2 and 1 `POINT`s —
3 / 2 / 1 cases on a track — everyone else nought, ties sharing a place. A
fixed scale is one press per team; typing points per team is what *Points* in
the menu is for.

## Done when

A challenge drawn from the line-up shows its line on the wall at 16:9 and 9:16,
the host places three teams from a phone at 390 px, the pawns walk 3 / 2 / 1
cases on the reveal; the menu's *Points* adds a case to a team mid-round and
the wall's track follows. All seen muted.
