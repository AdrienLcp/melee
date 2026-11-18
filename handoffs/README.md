# Open handoffs

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one.

| Series     | Wave | File                        | Depends on |
| ---------- | ---- | --------------------------- | ---------- |
| Games      | 3    | `games-03-five-clues.md`    | none       |
| Portuguese | 3    | `portuguese-08-flip.md`     | 02-07      |
| Portuguese | 4    | `portuguese-09-portugal.md` | 08         |

Each game adds arms to the same protocol unions (game kinds, round
content, answer modes), so they run one after another, never side by side.

`games-03` touches protocol and core, as `portuguese-08` does: run those
one after the other.

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.

<!-- cspell:words portugal portuguese -->
