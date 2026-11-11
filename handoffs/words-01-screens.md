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
- `mysteryword` is on the shelf. `longestword` is in `gameKinds`, not
  `shelvedGames`; its spine (`oklch(41% 0.1 250)`), icon (`SpellCheck`) and
  player/host/wall placeholders are provisional.

## The session

1. **`/impeccable` before any markup** (global rule 1). The two games share one
   material — letters on tiles — so one set of directions covers both: per
   direction, one complete example page with real content (a French word, full
   seats at `MAX_PLAYERS_PER_ROOM` with long names, the empty state) showing
   the mystery word's seat grid and keyboard, its wall of colour grids and its
   reveal, and the longest word's nine tiles and field, its wall with every
   seat's length and its reveal. One index page linking them, given to Adrien
   as a raw `file:///C:/...` URL. Stop there until he picks.

   **Done** 11/11/2026: `.impeccable/directions/words/` (local, git-excluded) —
   `index.html`, `a-plateau.html` (one shared board on the wall, AZERTY keys,
   tap-to-lay tiles), `b-tours.html` (a tower per seat, the device keyboard),
   `c-planche.html` (24 equal grids, ABC letter tiles), sharing `words.js` /
   `words.css`. The marks common to all three: in place on the leaf ink with a
   diamond, elsewhere on the sky ink with a ring, absent the socket.
   **Chosen 11/11/2026: A's seat with B's wall**, for both games. Build from
   those two pages (open them before writing a screen):
   - **Seat** (`a-plateau.html`, seat states): the mystery word's grid over a
     drawn AZERTY keyboard (QWERTY in English), keys inked by the best mark
     each letter showed, Effacer and a coral Valider; found or spent, the
     keyboard gives way to a paper card. The longest word's nine tiles are
     pressed to lay them into a row of nine slots, a laid tile sinking into its
     socket so a letter cannot be used twice; Effacer, Mélanger, coral
     Envoyer; the accepted words listed, the longest marked. No device
     keyboard on either seat (a physical keyboard still types).
   - **Wall** (`b-tours.html`, wall states): the mystery word as a tower per
     seat in two rows of twelve, one step in the place mark per letter in
     place on its best try, a crown once found, pawn, name on two lines and
     tries used under it; the reveal turns to every grid spelled out, ordered
     by the try that found it. The longest word as towers of face-down tiles
     in the spine, the length on top; the reveal lays them down face up,
     ranked, the draw's longest on top.
   - The console seated plays the seat; unseated it takes the wall's
     composition. The reveal's spelled grids run about 20px a cell at
     1440×900 — the one thing to measure again on the real screens.
2. **Mystery word on screens** — **Done** 11/11/2026, see plan 66 step 3's
   _Screens landed_. Two things stay open there: drive a **paired wall**
   (only the unseated console was seen), and judge the reveal's spelled
   cells at 24 seats (~10 px at 1440×900) on the real screens. The shared
   pieces the longest word reuses are already in
   `presentation/components/` (`letter-cell`, `letter-grid`, `mark-legend`,
   `revealed-word`) and `features/player/word-keyboard.tsx`; a drawn key
   gives its focus back after a pointer press, keep that for the tiles.
   The browser pass is scripted: `.playwright-mcp/mw-run.mjs` (git-ignored)
   runs Playwright from Node — the MCP browser may be held by another
   session — creates the room, seats 22 raw sockets plus two phones, plays a
   refusal, a try, a find, six spent tries and the reveal, films each change
   and writes `.playwright-mcp/mw-*.png`. Copy it for the longest word.
3. **Longest word on screens**, the same list (no level).
4. Seen **muted** (`melee:volume` `'0'` by init script) on a wall, a seated
   console and two phones at full seats; every new screen's entry and leaving
   **filmed** (`docs/browser-driving.md`). Close both plans' steps, the README
   rows, the changelog; delete this file and its README row.

If the context nears 150k after step 3, commit, rewrite this file with what is
left, and stop.
