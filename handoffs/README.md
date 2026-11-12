# Open handoffs

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one.

| Series  | Wave | File                       | Depends on |
| ------- | ---- | -------------------------- | ---------- |
| Scoring | —    | `scoring-01-follow-ups.md` | none       |

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.
