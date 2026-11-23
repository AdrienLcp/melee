# Le compte est bon: unsent work, the rack, the badge, the wall

Read `README.md` and `docs/plans/69-make-the-number.md` first. Diagnosed
read-only on 23/11/2026, lines from `7ded3593`.

## 1. A player who ran out of time lost what they had built

Adrien: "a player didn't have time to press Envoyer; take what they had done,
like the other games — their last result."

**The feature exists** (3698910e, 13/11; production deployed 19/11 holds it):
`player.lean` — `apps/game/src/features/player/use-lean.ts` throttles to
300 ms, `make-number-answer.tsx:165-167, 263-274` leans the made tile nearest
the target, the server re-checks it (`leanCalculation`,
`round-service.ts:789-832`, refusing a forged one) and banks it at the close
(`takeUnsentLeans`, `:841-871`).

**Probable causes of the loss**:

- **A dropped lean is never re-sent**: `send` returns `false` on a closed
  socket (`use-room-socket.ts:437-441`), `use-lean.ts` ignores it, and
  `make-number-answer.tsx:270-271` already marked `leaned.current`. After a
  Wi-Fi blink or a phone sleep, the rack is never re-leaned unless it changes.
  **This touches every game that leans**, not only this one.
- A merge in the last ~250 ms arrives after the close (`wrong_phase`,
  `answerableRound` `:557`).
- Only the nearest **made** tile is leaned: a dealt tile left bare, or the
  last result when an earlier made tile is nearer, never is.

**Fix**: `useLean` keeps its latest value and re-sends it when a send fails
and when the socket reopens (mark sent only on success); lean the nearest
tile on the rack, dealt or made. Weigh a short server grace after the close
for a lean already in flight, against rule 2 (the server owns time) — a
grace measured by the server's own arrival stamp stays within it. Test: a
socket that drops and reopens mid-round still banks the rack.

## 2. Players can't tell what is selected or when an operator applies

Adrien: "players struggle to see which tile is selected, and when they can
use an operator. Improve the UI/UX." (He likes it as is; his table doesn't.)

Today (`make-number-answer.tsx:203-249`): tap a tile → lifted
(`data-lifted`, a 3 px inset ring + a 0.3 rem lift,
`make-number-answer.sass:216-221` — dark ring on yellow made tiles); operators
`isDisabled` until a tile is lifted (`:469`), idle and disabled operators
look almost alike in dark mode (`:285-295`); a second tile with no operator
just lifts that one, silently; tiles dim (`data-off`, `:392-397`) only once
an operator is chosen; a pending "695 ×" line (`:285-288, 358-362`).

**Do**: start with `impeccable`. The direction must make three states
unmistakable — nothing lifted / a tile lifted (operators armed) / tile and
operator chosen (valid second tiles invited) — with a motion between each,
in both palettes. Example pages per direction, one index, opened for Adrien.

## 3. The trophy badge is unreadable in dark mode

Screenshot: "🏆 695 à 9" black on dark blue. `.sends > .kept`
(`make-number-answer.tsx:308-321`, `make-number-answer.sass:78-90`):
`--track-b` ground with `--card-ink` text, about 1.2:1 in the dark palette;
`tokens-contrast.test.ts:68-71` tests `--track-b` only against `--track-ink`.
**Fix**: the tested pair (or a printed card shade, since it sits on the paper
card), and add the pair actually used to the contrast test.

## 4. The wall's ruler is mostly empty lines

Adrien (photo of the TV): "lots of lines for nothing; very few people are ever
in the 9s, and it's just ugly. Make something else."

Today: `apps/game/src/features/host/make-number-ladder.tsx` (+ `.sass`,
`helpers/make-number-ladder.ts`, rendered at `playing-stage.tsx:515`):
`ladderOf` buckets seats exact / 1–9 under or over / far / waiting; empty
rungs keep 0.6fr (`rungWeightOf`, `.tsx:44`); "far" erases the real distance
(292 and 50 look alike). Data on the view (`packages/protocol/src/room.ts:896-919`,
`make-number-round.ts:150-200`): `target`, `tiles`, live
`values: [{ playerId, value }]`, each the seat's nearest sent or leaned.

**Do**: `impeccable`, with real data — eight seats, two exact, a few close,
two far, one not started. Candidate shapes from the data: a number line with
a clamped/log scale round the target; seats sorted by distance (big value +
"à N"); seat cards coloured by distance band. "Sent vs still building" would
be a protocol addition (`seatValueSchema`, no steps leaked) — add it only if
the chosen direction needs it. The wall never scrolls; check it full.

## Done when

The rack survives a dropped socket (test + browser with the network cut); the
rack and the wall redrawn in the direction Adrien picked, filmed; the badge
readable in both palettes with its test. Plan 69's record, changelog, delete
this file and its README row.
