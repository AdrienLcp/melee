# Handoffs from the 2026-11-06 game night

One file per fresh session. Delete a file in the commit that finishes it, and
delete this README with the last one.

| Wave | File                              | Depends on                                                                                                      |
| ---- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1    | `phone-keyboard-and-away-mark.md` | none                                                                                                            |
| 2    | `scoring-02-board-or-points.md`   | none (scoring-01 landed)                                                                                        |
| 2    | `scoring-01-follow-ups.md`        | none                                                                                                            |
| 2    | `blind-test-variety.md`           | none; kept out of wave 1 so it does not collide with scoring-01 in `packages/protocol` and the host preferences |

Sessions in the same wave share one checkout. Commit with
`git commit -F msg -- <paths>` (`.claude/rules/committing.md`), use only the
dev server the session started itself, and run `pnpm validate` only when no
other session is running it.

After everything has landed: a new word game (Motus, Scrabble, or a blend).
Design it in its own session.
