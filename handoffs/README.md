# Open handoffs

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one. The content series shares one plan:
`docs/plans/68-evening-content.md`, read first by every session of it.

| Series  | Wave | File                                    | Depends on |
| ------- | ---- | --------------------------------------- | ---------- |
| Scoring | —    | `scoring-01-follow-ups.md`              | none       |
| Content | 4    | `content-04-timeline-and-slate-keys.md` | none       |
| Content | 5    | `content-05-own-numbers.md`             | content 4  |
| Content | 6    | `content-06-black-square-themes.md`     | content 5  |
| Words   | —    | `words-01-screens.md`                   | none       |

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.
