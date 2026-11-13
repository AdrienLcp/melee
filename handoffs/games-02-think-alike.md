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
  (its `key`/`mergedKeys` are on each group).

**Part (1) finished 13/11/2026** (a second run on what part 1 left open):

- **The React error is fixed at its root, in the shell**: `lazyModule`
  readers wrote `loaded() ?? use(load())`, so a render that suspended and was
  replayed once the chunk landed skipped `use()` and React threw. `load()` now
  marks its promise fulfilled when it lands and every reader calls
  `use(load())` unconditionally (`lazy-module.test.ts`). Not seen again in
  five harness runs (two phones each).
- **The wall's reveal**: piles on 1.75fr beside a two-column ranking past
  twelve seats (`wall-page.sass`); names wrap between words only, a word
  wider than its column ends on an ellipsis on its own line; a card's word is
  sized by its longest word (`--letters`), so nothing hyphenates mid-word;
  lone answers alone sit centred in wider cards. Audited at 1440×900,
  1280×720 and 1080×1920 with piles and with 24 different answers: no
  scroll, nothing outside, no name cut.
- **The podium card beside a wall** (the console's reveal) collapsed every
  stack to nothing: the card is now 46rem and each stack 9rem
  (`host-podium.sass`). Still the part-1 piles, with no merge — part 2's.
- **The seat's reveal**: _every pile_ scrolls inside its card (a fifth of the
  shown height), so the round's block and _Prêt_ come up the page instead of
  a screen and a half down. A blank seat reads _Ta pile — Rien écrit — 0_.
- **Seen**: the reveal film (`.playwright-mcp/ta-film-r1-reveal.png`) turns
  lone cards together, then 2, 3, 4, 5, 7 one after another about 0.9 s
  apart, the biggest last; _Fraises_ and _une fraise_ land in one pile on
  the wall and the phones; the phone lying down splits the round from the
  standings. Not seen: the console with no wall at phone width (part 2
  redoes that reveal).

**Part (2a) done 13/11/2026** — the console's merge and split, in
`3149fb36`, `820f77f9`, `b6134156` (read their messages):

- `features/host/think-alike-sorting.tsx` — a row per answer, lone ones
  included (biggest crowd first): drag a row onto another (react-aria; on the
  keyboard Enter on the handle, arrows, Enter), the `ActionMenu` ⋯ listing
  _Avec « X »_ as the fallback, a merged answer folded under its row with
  _Ressortir « yogourt »_. Wired like Petit Bac's strike: `onRegroup` in
  `reveal-panel.tsx` → `room-stage.tsx`.
- **The wire changed**: a group's `mergedKeys: string[]` is now
  `merged: { authors, key, text }[]` (protocol, core `crowdGroups`), because
  the key drops spaces and accents and could not print _Ressortir « Tour
  Eiffel »_.
- **With a wall** the console shows the rows directly; **with none**
  (`view.isWallConnected`) it keeps the piles turning over, _Regrouper_ /
  _Revoir les piles_ on the _Cette manche_ line swapping to the rows
  (`think-alike-console-reveal.tsx`), back face up (`isFaceUp`). A short or
  narrow box lays the piles one a line.
- A regroup moves only what changed on the wall and the phones: elements keep
  their first-drawn DOM order and take their place from CSS `order`
  (`useFirstDrawnOrder`), because Chrome restarts an animation React moves.
- `host-panel.tsx`: a narrowed console opens on _Partie_ in a running game
  (`narrowStart` was frozen on the answer given before a game was picked).
- Harnesses (git-ignored): `.playwright-mcp/ta-run.mjs` (`REGROUP=1`) and
  `.playwright-mcp/ta-console.mjs` (`SEATED`, `WALL`, `REGROUP`, and a flag filming the phone).

## Next session

State 13/11 night: everything above is committed and pushed.

1. **The two motion defects left by 2a are fixed** (14/11): the piles
   turning over again on a console narrowed past the desk (the stage hidden
   for a frame by `host-panel.sass`, not a remount), and the phone's list
   jumping as a merged row left (`row-closes`, and `useRowsTravel` keeping a
   height-travelling row's place current). Harness: `ta-console.mjs` with
   `RESIZE=1` or `PHONEFILM=1`.
2. **Part (2b)**: the setup (language, clock 10–60 s); the shelf
   (`shelvedGames`), the game's front door, the ready-made line-ups, both
   dictionaries, the catalogue (`docs/game-catalogue.md`) and `CLAUDE.md`
   rows (the game list in the intro, the `thinkalike.*` prefix). Muted, filmed,
   full room.
3. The plan's step 3 marked done with what diverged (the wire change, the
   no-wall console), the changelog, push (`main`, staging deploys), and this
   file rewritten for step 4 (the evening's own prompts) or deleted with
   `README.md`'s row.

One subagent for 1, one for 2, in turn — they share the dev server ports.
