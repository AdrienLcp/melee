# Stage 32 — quotes

A rival party game ships a *where is that line from?* round. The question was
whether it is a game of its own or a rubric of the quiz, and the answer is the
one `game-catalogue.md` already gives for an answer mode: the pool, the
countdown, the buzz, both answer modes, the speed bonus, the reveal and the
board are the quiz's, unchanged. A famous line is a quiz question whose prompt
is the line, whose answer is where it comes from and whose decoys are three
places it could have come from. So it is a **ninth chip**, `quotes` —
*Citations* in French, *Quotes* in English — and a table that ticks it alone
plays the round the rival sells.

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
- **Five kinds of line in one chip**: a film, a series (cartoons, anime and TV
  shows included), a video game, an ad — the answer is the brand — and a real
  person. The answer changes nature from row to row, so each authored row
  carries its `kind` and `quotes-source.ts` appends what to name to the line —
  *Which film?*, *Who said it?*, *Which brand?* — because a typed answer
  must know what it owes before four candidates are there to say.
- **Hand-written lists**, `apps/server/scripts/quotes-fr.json` (457) and
  `quotes-en.json` (548), read into the bank build like any other source, so
  the winnable and repeated-prompt passes run over them too. No open bank
  carries a line with where it comes from and three plausible others. Each
  language is its own list rather than a translation: a French table quotes the
  dub, and an English one the original.
- **Every row was checked** against Wikiquote, Wikipedia or a citable article
  for its wording and its attribution, by the agents that wrote them; the ones
  that could not be confirmed were dropped, not guessed. Apocryphal attributions
  that are part of the culture (Louis XIV, Archimedes) are kept and say so in
  the note.
- **Text only.** A short quotation in text is a citation; a clip from a
  soundtrack is not ours to ship.
- **`accepted` carries the franchise and the other language's title** — *Star
  Wars* for *The Empire Strikes Back*, *The Godfather* for its Part III —
  because a table shouts the franchise, and a row never carries a sibling of
  its answer as a decoy, which is what would make that spelling a hedge.
- **The bank's own credit is not on the credits page.** That page names the
  people whose work was reshaped; the lines belong to their authors, and the
  selection, notes and decoys are this repository's, under the share-alike line
  the page already ends on.

## Left open

- **A French dub's exact wording** is the commonly quoted form on about forty
  French rows, where only who says it and in which work could be confirmed —
  mostly animated films. A row found wrong at a table is fixed in the JSON and
  the bank rebuilt.
- **French stops short of 500** (457): the shared web-search budget ran out
  during the authoring pass, and lines were dropped rather than kept
  unverified. Growing it is writing more rows, nothing else.
- **A game of its own** would earn its place only with a mechanic the quiz does
  not have: the line revealed word by word, paying more for an earlier buzz.
  Not built until a table asks for it.
