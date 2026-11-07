# Scoring, part 1 — what the browser check found

Found while checking `scoring-01-one-scale` in a real browser on 2026-11-07.
None of it changes the 100-point rules; each is its own fix.

1. **A Worker reload mid-round restarts the round's clock.** Every socket
   dropped around 22 s into a quiz round when the dev Worker reloaded; an
   answer at 24.7 s was then paid as if at 2.3 s (`+9`, more than one at
   12.7 s). A deploy during a round would do the same in production. Find
   where the round's elapsed time is rebuilt after the Durable Object restarts
   (`scoredAfterMs`, the round's own clock that `clockedPay` reads) and keep
   it across the restart. Reproduce in `worker-object.test.ts`, which already
   restarts the runtime.
2. **Le juste chiffre's winner row squeezes the name to `B..` at 1280×800.**
   The round podium's first row is drawn larger, and its figure
   (`2 500 000 habitants`) keeps its width by design
   (`round-podium.sass`, `.words[data-figure]`), so the name takes what is
   left. `impeccable` first; check the full table at both sizes.
3. **Black square's pips sum to 102 on a nine-answer sheet** (6, 11 and 17
   each third, every share rounded alone) while the rule says the sheet is
   worth 100. The sheet itself pays exactly 100; only the printed shares
   drift. Round the shares so they sum to the whole (largest remainder) in
   `pointsForTier`'s callers, or print them without figures.
4. The console's lobby showed no scoring sentence (`GamePitch`) at 1280 with
   a game picked; the player's up-next card did. Check whether that is
   intended.
