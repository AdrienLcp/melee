# Shades: score where the cursor was when time runs out

> « Dans le jeu "nuancier": si la personne n'a pas validé, on prend comme
> réponse là où était son curseur (des fois ils ont pas le temps). »

Agreed: a colour rebuilt to within a few degrees and not validated in time
scores nothing today, which punishes the slow hand rather than the eye.

## Where it stands

- Client: `apps/game/src/features/player/swatch-answer.tsx` — the picker's
  `onChange` only sets local state (line 73), the button sends
  `player.answer` `{ kind: 'colour', colour }` once (lines 83-87). Picker:
  `presentation/components/colour-picker.tsx`, starting at `#808080` (line 31).
- Protocol: colour arm of `player.answer`, `packages/protocol/src/client-message.ts:156-159`;
  types in `swatch.ts`.
- Server: refused while the colour is still shown (`round-service.ts:547`),
  stored at line 595, graded at 1092 (`gradeColour`,
  `apps/server/src/domain/round/swatch-round.ts:51`). On time-out,
  `round-conductor.ts:788` → `closeRound` (`round-service.ts:1598`) →
  `settleSimultaneousRound` (line 719), which only loops over
  `round.attempts`: a seat that never sent gets no award at all.

## Decided

1. A save-as-you-go frame, on the pattern of `slate.write` / `petitbac.write`
   (`client-message.ts:224-258`; client debounce in `petit-bac-sheet.tsx:103-129`
   with `SAVE_DELAY_MS`; server in `ROUND_PLAY_MESSAGE_TYPES`,
   `socket-handler.ts:137-141`, dispatched 545-560): `swatch.lean`
   `{ roundId, colour }`, debounced from the picker's `onChange`, plus one
   unconditional send as the clock's last second starts so the final position
   is not lost in the debounce.
2. Stored as a per-seat draft on `SwatchContent` (`room.ts:445`), apart from
   `attempts` — otherwise `everyoneIsDone` (`round-service.ts:683`) ends the
   round on the first drag.
3. In `closeRound`, before settling, every seat with a draft and no attempt
   gets the draft as its attempt, graded and paid like one **with no speed
   bonus** (it did not answer; it ran out). The reveal says so on that seat's
   own screen ("pris où était ton curseur"), so nobody wonders why they scored.
4. A seat that never touched the picker sends no draft and still scores
   nothing: `#808080` untouched is not a guess.
5. Drafts never reach any view (`room-view.ts`) — a player is never sent
   another's answer. Bump `PROTOCOL_VERSION` (`packages/protocol/src/version.ts`),
   document the frame in `docs/realtime-protocol.md`.
6. Same treatment is worth weighing for the other "everyone at once" games
   with a pick held on screen — Atlas's pawn (`map-answer.tsx:46-47` says it is
   never sent), Timeline's order. Weigh, decide, and either do it in this
   session or write why not into `docs/game-catalogue.md`.

## Verify

Server tests first (tag `[swatch]`, the socket harness): a dragged-not-sent
seat is paid without a speed bonus, an untouched seat is not, a sent answer
is never overwritten by a later draft. Break one on purpose. Then a muted
browser round where one player drags and never validates. `pnpm validate`,
changelog, delete this file.
