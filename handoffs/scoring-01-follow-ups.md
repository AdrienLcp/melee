# Scoring, part 1 — what the browser check found

Found while checking `scoring-01-one-scale` in a real browser on 2026-11-07.
None of it changes the 100-point rules; each is its own fix. The round clock
restarting after a Worker reload is fixed (`resumeRoundClock` no longer resets
a clock nobody held). Three screen fixes are left, each needing `impeccable`
first and a muted browser pass.

1. **Le juste chiffre's winner row squeezes the name to `B..` at 1280×800.**
   The round podium's first row is drawn larger, and its figure
   (`2 500 000 habitants`) keeps its width by design
   (`round-podium.sass:83`, `.words[data-figure] { flex: none }`), so the name
   (`flex: 0 1 auto`, `min-width: 0`) takes what is left. Lead: in a row whose
   words are a figure or a picture (`li:has(> .words[data-figure])`, and the
   matchstick/swatch `:has` rule beside it), let the row wrap
   (`flex-wrap: wrap`) so the figure and the points go under a whole name
   rather than cutting it. A plain `.words` has a zero basis and never forces
   a wrap. Check the wall's fixed-height round card still fits (it drops the
   podium to its first row on a short stage). Check the full table (24 seats,
   20-character names) on the console at 1280×800, the wall, and a phone at
   390×844. `.playwright-mcp/reveal-leaves-run.mjs` shows how to seat raw
   sockets from a driver page; the host's true value is
   `hostView.currentContent.value`, the answer is
   `{ type: 'player.answer', roundId, answer: { kind: 'number', guess } }`.
2. **Black square's per-answer figures cannot add up.** A nine-answer sheet
   prints 6, 11 and 17 three times each (102), and no uniform figure per tier
   can sum to 100 (5.56 / 11.11 / 16.67). A lone find is worse: the sheet
   re-weighs (`pointsForCells`), so `[0, 8]` with 8 doubled pays 33 while the
   reveal prints 6 + 17 × 2. Decided: drop the per-answer figures in points
   mode, as board mode already does — the pips (and the `×2` badge) say the
   tier, and the seat's real pay is its podium/standings figure. Sites: the
   `round.scored` beside the pips and the doubled `blacksquare.tier` in
   `presentation/components/black-square-reveal.tsx:~108-140`, the
   `blacksquare.tier` figure in `black-square-pips.tsx:48` (use `tierOf` as on
   a track), and the hit line `blacksquare.answer.hit` in
   `features/player/black-square-answer.tsx:~66-80` (use `answer.found`).
   Then `pointsForTier` has no caller: delete it and its test
   (`packages/core/src/blacksquare/sheet-pay.ts:75`), the unused keys in both
   dictionaries, and rewrite `apps/game/DESIGN.md:1385` and `:1391` (_a hit
   with what it paid_, _name, pips and what it pays_).
3. **The console's lobby has no scoring sentence: a regression.**
   `f039bdd2` put it there on purpose (the screen that explains the game
   aloud says what a round pays); `a98d6fe6` moved it into the Games tab;
   `b6822e1a` removed that copy without saying so. `GamePitch`
   (`features/host/lobby-stage.tsx:95`) is drawn on the wall only, by design.
   Fix: put `<ScoringRule game={view.settings.game} settings={view.settings} />`
   back in the Games tab where a game is set, just above `<EveningRounds>` in
   `features/host/setup-tabs.tsx:~338`, with a caption style in
   `setup-tabs.sass`; fix the JSDoc at `lobby-stage.tsx:286-295`, which still
   says the console reads it off its games tab. `DESIGN.md:674` already
   describes it there. Film the tab (it enters with a motion).
