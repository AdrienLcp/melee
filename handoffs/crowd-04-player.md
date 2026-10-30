<!-- cspell:disable — quotes the French screens verbatim -->

# The player's screen at 32 seats

Settle `crowd-01-direction.md` first. Findings from the 32-seat run on
30/10/2026, at 390×844 and 360×640. The screen is one seat that never
answered. **Answering screens must fit `100svh`; everything else may scroll.**

## Answering screens that do not fit — P1/P2

- **Estimate, 360×640.** The field, its unit and *Envoyer* run past the right
  edge and are clipped, along with the timer digits. 390 is fine.
- **Most likely, round.**
  - At 390 the two-column ballot cuts almost every long name ("Anne-Charlot…",
    "Évariste Galo…"), and the last name is the part that tells people apart.
  - At 360 it is one column in a 369 px inner scroller showing 6 of 32 seats,
    so finding someone means five screens of scrolling against the clock.
  - Both have one cause: the ballot needs a dense layout that keeps names
    whole.
- **Timeline, 360×640.** *J'envoie mon ordre* sits ~95 px below the fold. At
  390 there are ~70 px of empty space above the instructions to reclaim.
- **Petit Bac, 360×640.** *Stop · 0/6* is half off-screen (45/40), and the
  category labels wrap to 2–3 lines.

## Reveals — scroll allowed, information still lost

- **Estimate.** When every guess lands in one bucket, the 32 pawns stack into
  a ~1,900 px tower. The player's own result and the standings start ~2,000 px
  down. The stack needs a cap or a smaller pawn scale; spread-out guesses read
  well.
- **Inner clock.**
  - Names are cut to the first name.
  - 29 "n'a pas appuyé" rows come before the standings, so the page is
    ~2,600 px.
  - The player's own row is not marked.
- **The extra column truncates names in the standings.** One cause: a long
  name and an extra column share one line. The quiz and blind test already
  wrap the extra under the name.
  - Timeline: "Théodore Vander…".
  - Most likely: "Théod…" on the winning row, and the winner is the answer.
  - Reflex: the false-start rows.
  - Blind test: the answer line ("…(Remastere…"). P3.
- **Most likely.** 32 full-height vote rows come before the standings
  (~2,300 px). Rows with one vote or none could collapse.
- **Atlas.** The distance labels overlap. Nothing is lost, because the
  standings list every distance.

## Polish — P3

- **The player's own row.** Atlas outlines it; inner clock and most likely do
  not.
- **The name in the top bar** wraps at a hyphen ("Galois-" / "K.").
- **The header is inconsistent across games.**
  - Round counter: "Manche 1/10", "1/10" or "Manche 1".
  - Menu: "Menu" as text, or a ☰ icon in buzzer, challenge, reflex and inner
    clock.
- **Higher or lower.** The rows say "aiguille du Midi" and the card says
  "Aiguille du Midi": a data casing issue.

## Holds up

- Every other round fits at 360×640: quiz, blind test, higher or lower,
  buzzer, reflex, inner clock, matchsticks, black square, slate, swatch and
  atlas. The room size never leaks into them.
- The lobby (a card, then a scrolling list of full names) and the final board
  (a big own-rank block, then a clean ranked list).
- "Ne sur 32" is always above the fold on a reveal.
- No horizontal page overflow. The report's `pageX: -15` is the measuring
  script, not the page.

## Not reached

- The Petit Bac voting and reveal, and the slate reveal.
- The reflex round at full density: the shot was taken after the race.
