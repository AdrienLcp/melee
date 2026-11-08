# Difficulty, part 5 — closing the series

The audit and the wiring landed (`214f37e9`, `34bca5f8`, `ffb41d1b`,
`982e52fb`): the timeline deals `easy` from `knownToChildren` events thirty
years apart, Petit Bac tiers its categories, and `docs/game-catalogue.md`
(_Which games take a level_) says why Shades, Matchsticks and the games with
nothing to deal take none. Nothing of it is pushed yet: the series validates
once, here.

Part 4 landed too, not pushed yet, like the rest: Plus ou moins and Le juste
chiffre deal French towns, regions and departments, and `easy` pairs hold a
French side inside a wider band. Its reading for the stage record is in
`docs/plans/58-estimate.md` (_France, added with the level_), sitelinks
refused included.

## Closing the series

1. `pnpm validate` once no other session is running it, after part 4 has
   landed. Fix whatever it reports, whoever wrote it.
2. Record the stage as `docs/plans/62-difficulty.md`: what it bought, the
   decisions of part 1 (one vocabulary `easy | mixed | hard`, `mixed` a third
   a tier, a level never changes the pay, the evening level derived rather
   than stored), the capitals finding part 3 wrote into
   `docs/game-catalogue.md`, the timeline and Petit Bac readings above. Add
   its row to `docs/plans/README.md`.
3. Delete the `difficulty-*` handoffs and their rows in `handoffs/README.md`
   in that commit, then push and watch CI (a push deploys once it is green).
