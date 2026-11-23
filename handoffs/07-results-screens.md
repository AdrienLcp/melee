# The final results screen, Think alike's reveal and field, Five clues' pill

Starts once `02-board-and-reveals.md` has landed (it changes `RoundPodium`'s
ranking, which every reveal here reads). Read `README.md` first. Mapped
read-only on 23/11/2026, lines from `7ded3593`. Start with `impeccable` for
items 1 and 2.

## 1. The final results screen, the same on every device

Adrien: "the results screen on a player's iPhone wasn't the same as on mine
(Galaxy S25 Ultra): I saw the top 3, she only had the top 1. Since this
screen scrolls, I think we can rethink its whole UI and show the same thing
everywhere — every player and every ranking in full, for example."

**Cause (confirmed)**: on a phone the last round's reveal (`round.isFinal`)
renders `RoundPodium` (top 3 of that round), the game-over notice, then
`OverallStandings` (`apps/game/src/features/player/player-round-stage.tsx:293-366`).
The mixin `podium-first-alone` (`player-round.sass:49-54`) hides places 2–3
below 640 px of viewport height (`:701, 710-711`; `:687-691` wide), and iOS
Safari measures height with its toolbars showing. `PODIUM_PLACES = 3`
(`round-podium.tsx:41, 105`) caps it in JS.

Today, finished phase: the phone shows `YourPlacing` + a full
`Scoreboard isResult` (+ `TeamFinish`) (`player-round-stage.tsx:501-525`);
host and wall show winners, `SeatPodium` (teams on points), `Standings` and a
`ScoreTrack` (`features/host/final-board.tsx:48-136`), the wall never
scrolling (`wall-page.sass:326-327, 406-417, 489-512`). Data: `players`
(score, board square and move), `teams`, and `round.awards` for the last
round only — no per-round history.

**Decided**: no viewport-height condition decides what a phone shows. The
phone's last reveal and finished board list **every seat**, ranked, scrolling
when needed; the last round's podium shows every scorer. "Every ranking"
across rounds would need a per-round history in the protocol — the direction
pages show whether it earns its place (e.g. who won each game of the
evening) and the session adds it only if Adrien picks a direction using it.
The wall keeps fitting without scroll, full at `MAX_PLAYERS_PER_ROOM`.

## 2. Think alike's reveal on the wall is strange

Adrien (photo): "a block with rounded corners, other blocks under it, and the
names further below — I can't describe it, but it's strange. Redo the UI."

`ThinkAlikePiles` (`apps/game/src/features/host/think-alike-piles.tsx:115-343`,
`.sass`, mounted at `reveal-panel.tsx:378`; also the console with no wall via
`think-alike-console-reveal.tsx`; the player's reveal is
`features/player/think-alike-revealed.tsx`). A pile is a `.stack` (big card
`.top`, `min(max(70cqi, 3.5rem), …)`, sass `:175`), then `ol.edges` (one
card-coloured strip per author with a tiny pawn — meant as the pile's
thickness, `:24, 225-246`), then `PayPill`, then `ul.authors` in a separate
subgrid row with `columns: 9rem` (`:36, 55, 157, 283`) — so the names spread
far below. **Do**: directions where each answer and its authors read as one
object (names on or right under the card), the pile's size said by its
count, and the host's grouping ("Regrouper") kept. Wall full, never
scrolling.

## 3. Think alike's field is tiny, with a stray line

Adrien (screenshot): "the input is tiny, it should take more width even
empty — full width on a phone, with a max on desktop. And there's an odd line
at the top of the input."

**Cause (confirmed)**: `.think-alike-answer` is a grid with no columns
(`think-alike-answer.sass:9-12`) plus `answer-forms.sass:11`
`justify-content: center`, so its one track shrinks to max-content; the
textarea is `field-sizing: content` (`:65`). Fix:
`grid-template-columns: minmax(0, 1fr)`, a `max-inline-size` on the form
centred for desktop. **The line (probable)**: `.card-head`'s
`border-block-end` (`:35`) right above the textarea's focus ring (outline of
`--ink` offset 3 px, `_focus.sass`, card inks `_piece.sass:71-80`) and the
card's own focused ring (`:28`) — keep one focus treatment.

## 4. Five clues' reveal: a green pill wider than the pawn

Screenshot: on the 20-point rung, the player's pawn sits in a green pill with
empty space on its right. **Cause (confirmed)**: `.finder` keeps
`auto auto minmax(0,1fr) auto` with `gap: 0.4em`
(`presentation/components/five-clues-reveal.sass:110-112`) while every child
but the pawn is visually hidden at seat size (`:226-227`), leaving 1.2em of
gaps inside the `inline-grid` (`:218`) that `[data-you]` paints (`:222-224`).
Fix: one column, no gap, at seat size.

## Done when

The pages picked by Adrien built; final screens identical on a 375×667 and a
412×915 viewport and the wall full; Think alike reveal and field redrawn and
filmed; the pill hugs the pawn. Changelog, delete this file and its README
row.
