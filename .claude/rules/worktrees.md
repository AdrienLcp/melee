# Worktrees and processes on Windows

> **Unscoped on purpose**: it applies before a branch is started and after it
> lands, when no file of the repository is being read.

## A branch goes in a worktree beside the checkout

Never a `git checkout` in `C:/git/melee`: other sessions run there.

- **Under `C:/git/wt-<branch>`**, short: a worktree under a deep temp folder
  pushes pnpm's `node_modules` paths past Windows' limit.
- **A worktree holds only what git tracks.** `validate` reads nothing
  git-ignored today; a git-ignored input added later — a `.dev.vars`, a
  `.env.local` — is copied from the main checkout before `validate` runs.
- **Stop the servers first, then remove it.** `wrangler dev` keeps its
  `.wrangler/` SQLite files locked, and `git worktree remove` fails half-way.
  It fails on pnpm's `node_modules` too: remove the folder with PowerShell
  `Remove-Item -Recurse -Force`, then `git worktree prune`.
- **Merging `main` into a branch that deleted a module**: grep `main`'s new
  code for imports of every module the branch removed. Git merges both sides
  cleanly, and the build breaks on an import that no longer resolves.

## Processes

- **A dev server is stopped by its process tree**, by the PID that started
  it — `taskkill /T /F /PID <pid>` (`//T //F //PID` from Git Bash). Stopping
  the shell that ran `pnpm dev` leaves its `node` and `workerd` children
  holding 3100 and 5273. Never by image name: other sessions' servers and the
  user's own browser run under the same names.
- **Never rebuild `apps/game/dist` under a running `wrangler dev`**: it serves
  404 while the folder is emptied, then hangs. Stop it, build, start it again.
- **Git Bash rewrites an argument that starts with `/`** into a Windows path
  (`/ws/rooms` → `C:/Program Files/Git/ws/rooms`): prefix the command with
  `MSYS_NO_PATHCONV=1` when an argument is a URL path or a `/X` option.
- **A copy that may meet a junction dereferences it**:
  `cpSync(from, to, { dereference: true, recursive: true })`. pnpm and a
  worktree's copied data use junctions, and `cpSync` copying the junction
  itself fails with `EPERM`.
