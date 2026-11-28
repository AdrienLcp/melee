# Handoffs

One file per session to come, written from Adrien's feedback after a family
evening (2026-11-27, the host on a recent TV's browser). Each file quotes his
words, points at the code, says what is decided and how to verify. Delete a
file once everything in it has landed, and its row here with it; delete this
folder when the table is empty.

| File                                             | Topic                                                                                      | Wave |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---- |
| [ready-and-reconnect.md](ready-and-reconnect.md) | The ready countdown stuck at zero, a returning player given a new seat at 0                | 1    |
| [reveal-standings.md](reveal-standings.md)       | Every seat in « Cette manche » on a phone, answer times, who voted for whom in Most likely | 1    |
| [kids-evening.md](kids-evening.md)               | A ready-made evening for a ten-year-old beside adults, Atlas decoys spread out             | 1    |
| [change-game-in-room.md](change-game-in-room.md) | Change what the room plays without closing it, a default end to every evening              | 2    |
| [console-on-a-tv.md](console-on-a-tv.md)         | The console's reveals on a TV: texts drawn over texts (seven photos)                       | 2    |
| [answer-at-time-out.md](answer-at-time-out.md)   | An unsent answer still counts when the clock runs out, in every game                       | 3    |

**Waves.** The four of wave 1 touch separate files and run side by side, each
in its own worktree (`.claude/rules/worktrees.md`). Wave 2 starts once wave 1
is on `main`: `change-game-in-room` shares the ready and settings code with
`ready-and-reconnect`, and `console-on-a-tv` lays out the podium
`reveal-standings` reworks. `answer-at-time-out` comes last — it touches the
award schema and the podium both rework — and runs the one `pnpm validate`.

**Common to all.** Each session pushes to `main` when done (CI deploys
staging); no `pnpm validate` per session — the pre-push hook and CI check each
push, and `answer-at-time-out`, the last, runs the one full `validate`. Every
screen touched is checked in a muted browser (`melee:volume` = `'0'`), full
(24 seats, long names), at phone width and on a wide screen, both palettes,
and every motion touched is filmed (`docs/browser-driving.md`). One CHANGELOG
entry per change, plans and docs updated with it.
