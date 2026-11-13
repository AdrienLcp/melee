# New game — Pense comme la table, step 3: the screens

Asked by Adrien on 2026-11-12 (one of three new games, with
`games-03-five-clues.md`). Every choice is weighed by what is more fun at the
table, never by what it costs to build.

**Steps 1 and 2 landed 13/11/2026**: the plan
[`docs/plans/70-think-alike.md`](../docs/plans/70-think-alike.md) holds every
rule as settled and what step 2 decided beyond it — read it first. The server
deals the game end to end, reachable by a settings frame and not on the shelf:
`apps/server/src/domain/round/think-alike-round.ts`, the `match` mode, the
attempt `{ kind: 'match', answer }` and the lean of the same shape,
`host.mergeGroups` / `host.splitGroup`, and `think-alike-game.test.ts`. The
app only compiles: dictionary keys, an icon and the `switch` arms, no screen.

## This session: step 3 of the plan

**Direction picked 13/11/2026: A, piles of cards, with B's legibility.** The
example pages are local and git-ignored, under
`C:/git/melee/.impeccable/directions/think-alike/` — `a-piles.html` is the one
built (open with `?surface=seat|wall|console#state`; Playwright refuses
`file://`, serve the folder over HTTP), `b-colonnes.html` holds the pawn
columns to borrow from, `BRIEF.md` the rules they share. What A becomes:

- **Seat**: the prompt large; the answer written on a paper card (the field
  _is_ the card: the seat's pawn in a corner, the spine's rule, `n/40`),
  _Envoyer_ below, both above an open keyboard. Sent: the card laid face down,
  slightly askew, its back in the spine colour carrying the pawn and the seat's
  own line; below, the cards the others have laid, `16/24`. Reveal: the seat's
  own pile large with its pay and its authors' pawns, then every pile in the
  wall's order, its own framed, the list scrolling inside its card.
- **Wall, playing**: the prompt monumental, the clock, and the table where each
  card lands face down as its seat sends, marked with the sender's pawn; beside
  it _On attend 8_ and the names still writing. Never a word.
- **Wall, reveal**: the cards first gather into face-down piles, smallest to
  biggest left to right, so the table sees each crowd's size and bets on the
  big one; then the piles turn over one by one. **The two corrections from
  B**: the top card's word in very large type, and a pile's thickness made of
  its authors' pawns — one card edge a pawn — so a crowd counts at four
  metres. The count in the card's corner, the pay, the names under it; the
  biggest last and widest. Lone answers do not pile: small flat cards in a
  grid (23 of them fit); a blank seat is a blank card at the head of the line.
- **Console**: the clock and who has sent; at the reveal a row per pile, a pile
  dragged onto another merges it, the row's button lists the other words as a
  ≥ 44px fallback; a merged pile shows its folded card **legibly** (A's risk:
  it was too small) with _Ressortir « yogourt »_.

**Part (1) done 13/11/2026** (seat and wall, playing and reveal). What it
built and where it diverged, for part (2):

- `presentation/components/think-alike-table.tsx` — the face-down cards, one
  place a seat (stable per seat, a tilt and stray from its id), landing as
  each seat sends, _On attend N_ and the names folding away as they send; the
  seat shows a compact copy under its laid card with `16/24`.
- `features/player/think-alike-answer.tsx` — the paper card (pawn, spine rule,
  `n/40`, a wrapping line, Enter sends), every keystroke a `player.lean` of
  kind `match`; sent, the card laid face down and askew with the seat's own
  line. Also mounted by `playing-stage.tsx` for a seated console.
- `features/host/think-alike-piles.tsx` — the reveal on the wall and the
  unseated console (`reveal-panel.tsx`): blanks and lone answers as small flat
  cards (auto-fill columns when nothing piles), then the piles smallest first,
  gathered face down and turned one by one (`--turn-at`, about 0.9 s apart),
  the top card's count and word large, an edge per author carrying its pawn,
  the pay chip and names (two lines, clamped). The wall hands it a share of
  its height like make-number (`wall-page.sass`).
- `features/player/think-alike-revealed.tsx` — _Ta pile_ large with its pay
  and pawns, then every pile in the wall's order, its own framed.
- Tokens: `--spine-thinkalike` (the provisional `oklch(52% 0.13 38)`), its
  `on-`/`mark-` pair in the contrast test, `--spine-edge-thinkalike` and
  `--card-back-rule-thinkalike`. Strings: `thinkalike.answer.*`,
  `thinkalike.reveal.*`, `thinkalike.table`, `thinkalike.waiting`.
- **Diverged**: the wall's prompt sits on the round card with the sand (every
  game's), not bare on the board; the wall keeps its usual reveal split, so
  the piles get half its width beside the standings and long names are cut to
  two lines; a lone answer shows no `0` chip (the round block says it).
- **Seen**: `.playwright-mcp/ta-run.mjs` (muted, 22 raw seats + two phones,
  paired wall, settings frame through a wrapped console socket): no word on
  any other screen before the close, no wall scroll at 1440×900 and 1280×720
  with piles or 24 different answers; films `ta-film-r1-cards-land.png`,
  `ta-film-r1-reveal.png`. Not yet seen: 9:16 and lying-down phone shapes, and
  the reveal film after the per-pile stagger fix was not re-viewed.
- **For part (2)**: the console's merge/split UI goes beside `ThinkAlikePiles`
  (its `key`/`mergedKeys` are on each group); the phone logged React's
  _called use() to suspend … did not call use()_ once on joining — not
  traced.

Built in two parts, each its own subagent run: (1) the seat and the wall,
playing and reveal, with their motions filmed; (2) the console's merge and
split, the setup (language, clock), the shelf, the door, the ready-made
line-ups, both dictionaries, the catalogue rows, the plan, the changelog. The template is Make the
number's screens (the commits after `79124e0c` that touch `apps/game/src/features`), the
closest round to copy is the estimate's (one answer a seat, priced at the
close), and Petit Bac's strike is the console action that re-pays a revealed
round.

1. **A seat**: the prompt large, one field (`THINK_ALIKE_ANSWER_MAX_LENGTH`),
   _send_, then its line held while the others write; the field's draft sent
   as a `player.lean` as it changes, so the clock running out sends it.
2. **The wall**: the prompt, the clock, a mark per seat that has sent — never
   a word.
3. **The reveal**: `groups` turned over one by one, smallest first, each with
   its authors and what it paid; the wall never scrolls.
4. **The console**: the merge (drag or pick one group into another, a merged
   group's _take back out_ by its `mergedKeys`), the setup (language, clock
   10–60 s), then the shelf (`shelvedGames`), the game's front door, the
   ready-made line-ups and both dictionaries.
5. Muted, filmed, with `MAX_PLAYERS_PER_ROOM` seats at phone width and a paired
   wall; then the plan's step 3, the changelog, and the handoff for step 4.
