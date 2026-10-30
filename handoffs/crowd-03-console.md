<!-- cspell:disable — quotes the French screens verbatim -->

# The console at 32 seats

Settle `crowd-01-direction.md` first. Findings from the 32-seat run on
30/10/2026. The console was captured at 1440×900 and 390×844, beside a wall
(`WALL=1`) and as the room's only screen (`WALL=0`).

## Lists that overflow a fixed card onto the controls after them — P1

This is the most serious class. A click may land on a row instead of the
button under it.

- **Inner clock, reveal, both modes, both sizes.** The 32-row ranking runs
  through the "Manche 2" header, under the target stepper and *Manche
  suivante*.
- **Most likely, reveal.**
  - With a wall, the vote list runs under *Manche suivante* and *Terminer la
    partie*.
  - `ul.scorers` (207/181) is drawn beneath it, ghosting.
  - Without a wall, *Terminer la partie* sits on a row (`main` 1539/900).
- **Estimate, reveal.**
  - With a wall, the histogram covers the guess rows.
  - Without a wall, all 32 pawns stack in one column with no axis, and the
    guess list has a height of 0 (`ul.said` 285/0). The table never sees who
    was closest.
- **Timeline.**
  - Reveal: the timeline is drawn over the "Manche 1 sur 8" title.
  - Round: the pawn strip spills into "La suite".
  - Phone-sized: *Donner la réponse* sits on an event card.
- **Atlas, reveal.**
  - The map card covers the distance grid's first row, distances are cut, and
    the km labels pile up.
  - Phone-sized: the map overlaps the title.
- **Petit Bac with a wall, round.** The letter card collapses to a 30 px strip,
  so the letter is hidden, and the 32-row progress list overflows into "La
  suite". Phone-sized, the categories render as blank lines.
- **Challenge, round, both modes.**
  - 32 placing rows (− / 1er / 2e / 3e) overlap the challenge text and its
    hint.
  - Without a wall the stage is **2771 px** tall: the room sees buttons
    instead of the challenge.
- **Quiz and blind test with a wall, phone-sized round.** The answer pawn strip
  covers choices 3 and 4.

## The reveal grid loses the detail the host needs — P1

**Affects:** `ul.said` in quiz, higher or lower, blind test, estimate and
timeline. Beside a wall, this is the detail the console exists to show.

- **Cells and names.** Cells are ~190 px wide, so names are cut to 1–2
  letters.
- **What the cells show.** A correct cell shows `1 000 +935` with no name at
  all, and the answer each player gave never shows.
- **The scroller.** It is a 181 px window that cuts a row in half.
- **Without a wall.** Blind test and timeline keep the names, but at ~9 px.

## Collapsed panels beside a wall — P1

- **Slate, phone-sized.** The 1–10 item grid has a height of 0
  (`ol.items` 375/0), so items cannot be collected one by one.
- **Black square, phone-sized reveal.** The answers sit in a 158 px window.
- **Higher or lower, phone-sized reveal.** The pair card shows no values.

## Players column — P2

- **Beside a wall, laptop.** The column is 350 px. Once −/+ appear, names are
  cut to 6–9 characters (15–16 of 32), and "Jean-B…" is ambiguous for a host
  adjusting a score by name.
- **Without a wall.** The panel cuts the same names and cuts its last row in
  half.
- **Phone score chips.** Names are cut to 6 letters.

## The console as the room's screen — P2

- **Reveal and final standings.** The reveal shows 19 of 32 rows at ~11 px
  (8 in the challenge reveal), and the final shows 18 (12 phone-sized).
- **The host panel stays open while a round plays.** It is ~400 px, with
  × remove on every seat, and it squeezes the stage the table reads.
- **Lobby.**
  - The floating *À table !* covers chips in the third column.
  - The grid runs past the fold (926/900).
  - Chips are cut to 6 letters.
- **Beside a wall, phone-sized.** *Manche suivante* is below the fold at every
  reveal, behind a 32-chip grid. Without a wall the phone's tab bar pins it,
  and that works.

## Holds up

- No horizontal overflow anywhere.
- The laptop round stage without a wall reads from across a table in most
  games.
- Buzzer judging is clear in all four views.
- The phone-sized console without a wall is the best console of the set.
- Matchsticks and swatch render cleanly; their reveals were sparse.

## Not reached

The Petit Bac and slate reveals: the run never voted or marked.
