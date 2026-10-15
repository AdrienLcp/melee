# Stage 32 — quotes

A rival party game ships a *where is that line from?* round. The question was
whether it is a game of its own or a rubric of the quiz, and the answer is the
one `game-catalogue.md` already gives for an answer mode: the pool, the
countdown, the buzz, both answer modes, the speed bonus, the reveal and the
board are the quiz's, unchanged. A line from a film is a quiz question whose
prompt is the line, whose answer is the work and whose decoys are three works
it could have come from. So it is a **ninth chip**, `quotes`, and a table that
ticks it alone plays the round the rival sells.

## What was built

- **`quotes` in `questionCategories`**, beside `cinema`, and
  `PROTOCOL_VERSION` to 24 because a player tab parses `category` as an enum.
  The chip picker, the caption on the question and the host's remembered setup
  all read the list, so none of them changed.
- **Nine chips tile three by three** before they stack. Eight held one row
  down to 952px; nine need 1 031, and a wrap at the setup fold's 961 left one
  chip alone on a row — `e2e/strip-rows.spec.ts` caught it. Between the row and
  three of the widest label (510) the strip is a 3 × 3 grid, through
  `strip.tiles-below`'s first caller.
- **Two hand-written lists**, `apps/server/scripts/quotes-fr.json` and
  `quotes-en.json`, read by `quotes-source.ts` into the bank build like any
  other source, so the winnable and repeated-prompt passes run over them too.
  No open bank carries a line with its work and three plausible others, which
  is why they are authored. Each language is its own list rather than a
  translation: a French table quotes the dub, and an English one the
  original.
- **Films and series, as text.** No audio extract: a short quotation in text is
  a citation, a clip from the soundtrack is not ours to ship.
- **`accepted` carries the franchise and the other language's title** — *Star
  Wars* for *The Empire Strikes Back*, *The Godfather* for its Part III —
  because a table shouts the franchise, and a row never carries a sibling of
  its answer as a decoy, which is what would make that spelling a hedge.
- **The bank's own credit is not on the credits page.** That page names the
  people whose work was reshaped; the lines belong to their films, and the
  selection, notes and decoys are this repository's, under the share-alike line
  the page already ends on.

## Left open

- **The rubric is small** — 74 French lines and 75 English — and a category is
  drawn with one chance in nine whatever its size, so a long evening with every
  chip ticked meets it often. It stops being offered once a room has played it
  through. Growing it is writing more rows, nothing else.
- **A game of its own** would earn its place only with a mechanic the quiz does
  not have: the line revealed word by word, paying more for an earlier buzz.
  Not built until a table asks for it.
