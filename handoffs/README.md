# Open handoffs

Adrien's feedback after a weekend of play (23/11/2026), almost all of it on the
**Mêlée générale** ready-made line-up (`grandMix`), on a PC wired to a TV as
the host console and phones as seats. One file per fresh session. Delete a
file in the commit that finishes it, and delete this README with the last one.

| Wave | File                            | Depends on           |
| ---- | ------------------------------- | -------------------- |
| 1    | `01-replay-and-ready.md`        | none                 |
| 1    | `13-e2e-ports-per-worktree.md`  | none                 |
| 2    | `06-hands-free-table.md`        | 01 landed            |
| 2    | `07-results-screens.md`         | 02 landed            |
| 2    | `08-blindtest-flash.md`         | 01 landed            |
| 2    | `09-five-clues-any-subject.md`  | 05 landed            |
| 3    | `10-five-clues-new-subjects.md` | 09 landed            |
| 3    | `11-international-evening.md`   | 05, 08 and 09 landed |
| 3    | `12-ambient-music.md`           | 08 landed            |

## How every session here works

- **Its own worktree**, so a wave runs side by side:
  `git fetch origin --prune`, then
  `git worktree add ../wt-<file-slug> -b <file-slug> origin/main` from
  `C:/git/melee`, and work in `C:/git/wt-<file-slug>`
  (`.claude/rules/worktrees.md`: stop its servers by process tree, remove the
  folder with PowerShell, then `git worktree prune`). Each session uses dev
  ports of its own — another session's servers hold 3100 and 5273.
- **Landing**: `git fetch`, `git rebase origin/main`, `pnpm validate`, then
  push the branch onto `main` (`git push origin HEAD:main`) — no pull request.
  A rebase conflict in `packages/protocol` or a dictionary is another wave-mate
  that landed first: keep both sides.
- **The handoff dies with the work**: the commit that finishes it deletes its
  file and its row above, from the main checkout's copy (`C:/git/melee/handoffs/`).
- **UI is seen, muted, full and filmed** before it is called done: `melee:volume`
  `'0'` in an init script before the first navigation, `MAX_PLAYERS_PER_ROOM`
  seats with long names at phone width, a paired wall, every motion filmed
  (`docs/browser-driving.md`). A design choice starts with the `impeccable`
  skill and its directions reach Adrien as **complete example pages behind one
  index page**, opened for him in the built-in browser (`preview_start` with
  the `file:///C:/...` URL).
- **Finish the finishing touches**: changelog entry, the plan's record
  (`docs/plans/`), CLAUDE.md or a rule when a documented behaviour changes.
- Adrien's words are translated into English here; what he said is quoted as
  "Adrien:".
