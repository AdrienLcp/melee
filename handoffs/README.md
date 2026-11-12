# Open handoffs

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one.

| Series  | Wave | File                       | Depends on |
| ------- | ---- | -------------------------- | ---------- |
| Scoring | —    | `scoring-01-follow-ups.md` | none       |
| Budget  | —    | `bundle-budget-02.md`      | none       |
| Games   | 1    | `games-01-countdown.md`    | none       |
| Games   | 2    | `games-02-think-alike.md`  | none       |
| Games   | 3    | `games-03-five-clues.md`   | none       |

The three games each add arms to the same protocol unions (game kinds, round
content, answer modes), so they run one after another, never side by side.

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.
