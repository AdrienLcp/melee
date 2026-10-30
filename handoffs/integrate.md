# Land the `integrate` branch

Parent handoff. Everything from the 30/10 handoffs (atlas, line-up,
room-control, ui-bugs) plus the wall's portrait layout is built and merged on
branch `integrate`, worktree `C:/git/wt-integrate`. `main` has none of it except
the ui-bugs commits. Nothing is pushed yet. **Adrien's 30/10 push freeze does
not cover this branch**: these are fixes for production, and he asked for them
to ship — push once `validate` is green.

## Left: 4 end-to-end journeys

`pnpm validate` passes everything but `pnpm test:e2e`: 50 of 54 pass, these 4
fail (all in `e2e/choice-fits.spec.ts`, host console at phone sizes):

- `[layout] room, atlas name round` — "Which country is this?" spills at 320×568, 360×640
- `[layout] room, slate, an item marked on the wall` — "Rien écrit : Marc" spills at 320/360
- `[layout] room, slate, the sheets being written` — the per-item "x/8 écrits … Ramasser" rows spill at 320×568
- `[layout] room, verdict` — `section.verdict-panel` reaches 321 in a 568×320 viewport

Likely suspects, unconfirmed: the pause commit's `room-stage.tsx` change (the
host stage kept mounted under the paused card), the wall-portrait commits'
shared `track-podium.sass`, and the ui-bugs reveal fixes on main (`reveal-panel.sass`,
`23b1752`, `3af5c65`, `9061fa5`). Find the commit per test with
`git bisect` over `d23bb14..integrate`, running one spec with
`pnpm exec playwright test -c e2e choice-fits -g "<name>"` — but older commits
need the fixture fields added in `8503583` (`isPaused`, `walls`, `volume`,
`wallNumber`, `currentContent.playback`), or every view fails its schema and the
page sits on "Taking your seat…".

## Then

1. Full `pnpm validate` in the worktree, green.
2. Fast-forward `main` to `integrate` (`git merge --ff-only integrate` in
   `C:/git/melee`; another session's uncommitted files live there, leave them).
3. `git push origin main` (one push), then watch the CI run with
   `gh run watch` until the deploy job is green; fix and push again if not.
4. Remove the worktree (PowerShell `Remove-Item -Recurse -Force`, then
   `git worktree prune`), delete branch `integrate`, and this file.
