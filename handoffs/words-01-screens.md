# Words 01 — the two word games' screens

Read `docs/plans/66-mystery-word.md` (step 3) and
`docs/plans/67-longest-word.md` (step 2) first: both games are served end to
end, reachable by a settings frame, and each plan's **Done:** paragraphs say
exactly what every screen receives. This session puts both on the shelf.

## Where it stands

- `mysteryword`: dictionary, rules and server landed (`52a6574f`, `c4eaa885`).
  Every view carries `firstLetter`, `length`, `language` and `grids` (each
  seat's rows as colours alone); the reader's own `yourTries` carry letters;
  the reveal adds `revealedWord` and `revealedGrids`.
- `longestword`: served (`879fc829`). Every view carries `letters`, `language`
  and `lengths` (each seat's best length, never its word); the reader's
  `yourWords`; the reveal `revealedWords`, `bestWords` (≤ 3, familiar first)
  and `bestLength`.
- Both are in `gameKinds`, not `shelvedGames`. Their spines
  (`oklch(45% 0.1 122)`, `oklch(41% 0.1 250)`), icons (`WholeWord`,
  `SpellCheck`) and the player/host/wall placeholders are provisional.
- If `c4eaa885` and `879fc829` are not on `origin/main` yet, push them first:
  they were left local because the pre-push typecheck failed on another
  session's unfinished deck work.

## The session

1. **`/impeccable` before any markup** (global rule 1). The two games share one
   material — letters on tiles — so one set of directions covers both: per
   direction, one complete example page with real content (a French word, full
   seats at `MAX_PLAYERS_PER_ROOM` with long names, the empty state) showing
   the mystery word's seat grid and keyboard, its wall of colour grids and its
   reveal, and the longest word's nine tiles and field, its wall with every
   seat's length and its reveal. One index page linking them, given to Adrien
   as a raw `file:///C:/...` URL. Stop there until he picks.
2. **Mystery word on screens**: the seat (grid, on-screen keyboard coloured by
   what each letter has shown, the refusal said without costing a try), the
   wall, the console (seated and not), the reveal, the setup (length 5–8,
   duration, level, language defaulted from the locale as the ready-made
   line-ups do for the quiz), spine and icon, `document-head.ts`, both
   dictionaries, `shelvedGames`, ready-made line-ups and Grand mix, the
   catalogue and `.claude/CLAUDE.md` rows.
3. **Longest word on screens**, the same list (no level).
4. Seen **muted** (`melee:volume` `'0'` by init script) on a wall, a seated
   console and two phones at full seats; every new screen's entry and leaving
   **filmed** (`docs/browser-driving.md`). Close both plans' steps, the README
   rows, the changelog; delete this file and its README row.

If the context nears 150k after step 2, commit, rewrite this file with what is
left, and stop.
