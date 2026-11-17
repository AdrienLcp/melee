# Open handoffs

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one.

| Series     | Wave | File                            | Depends on |
| ---------- | ---- | ------------------------------- | ---------- |
| Games      | 3    | `games-03-five-clues.md`        | none       |
| Portuguese | 2    | `portuguese-04-black-square.md` | 01         |
| Portuguese | 2    | `portuguese-05-quantities.md`   | 01         |
| Portuguese | 2    | `portuguese-06-quiz-bank.md`    | 01         |
| Portuguese | 2    | `portuguese-07-words.md`        | 01         |
| Portuguese | 3    | `portuguese-08-flip.md`         | 02-07      |
| Portuguese | 4    | `portuguese-09-portugal.md`     | 08         |

Each game adds arms to the same protocol unions (game kinds, round
content, answer modes), so they run one after another, never side by side.

Portuguese wave 2 touches separate files — one bank, one dictionary, one
word list each — so its sessions may run side by side; 01 has landed
(`docs/plans/72-portuguese.md`). `games-03` touches protocol and core, as
`portuguese-05` and `portuguese-08` do: run those one after the other.

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.

<!-- cspell:words portugal portuguese -->
