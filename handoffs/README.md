# Open handoffs

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one.

| Series     | Wave | File                           | Depends on   |
| ---------- | ---- | ------------------------------ | ------------ |
| Scoring    | —    | `scoring-01-follow-ups.md`     | none         |
| Difficulty | 2    | `difficulty-02-picker.md`      | none         |
| Difficulty | 2    | `difficulty-03-countries.md`   | none         |
| Difficulty | 3    | `difficulty-04-numbers.md`     | difficulty 3 |
| Difficulty | 3    | `difficulty-05-other-games.md` | difficulty 2 |
| Black sq.  | 3    | `black-square-01-shape.md`     | difficulty 2 |
| Black sq.  | 4    | `black-square-02-themes.md`    | black sq. 1  |

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.

After everything has landed: a new word game (Motus, Scrabble, or a blend).
Design it in its own session.
