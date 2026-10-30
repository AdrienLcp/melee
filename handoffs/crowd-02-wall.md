<!-- cspell:disable — quotes the French screens verbatim -->

# The wall at 32 seats

Settle `crowd-01-direction.md` first. Findings from the 32-seat run on
30/10/2026, at 1920×1080 and 1280×720. Re-run with
`WALL=1 node handoffs/crowd-simulation.mjs <game>` and look before and after.
**Nothing on the wall may scroll or be cut.**

## Shared components — fix once, every game benefits

- **Standings (`ol.scoreboard.ranked`), on every reveal and final board.**
  - The list scrolls inside its box: 27–28 of 32 rows show at 1080p and
    17–18 at 720p, with a half-cut row at the bottom.
  - Names are ~13 px and ranks ~10 px, unreadable across a room.
  - The final board's winner block is good; its right half is this
    micro-type list.
- **Lobby, every game.** It overflows by +10 to +53 px at 1080p and by +107 to
  +164 px at 720p.
  - Cause: the right column stacks the title, two ~15 px rules paragraphs,
    "32 joueurs" and a 3×11 grid of ~64 px name cards, and none of it shrinks.
    The QR column has free space.
  - What is lost: at 720p rows 9–11, so 8 players are invisible. At 1080p, in
    matchsticks (whose blurb is the longest), the 11th row is half cut.
- **The "who said what" reveal grid** (quiz, blind test, timeline, higher or
  lower, atlas, estimate).
  - Three fixed columns, with name, answer and points on one line. The points
    never shrink, so the answer is cut first.
  - 1080p, cut names / cut answers: blind test 14/17 (27 answers at 720p),
    timeline 15/16, quiz 14/3, higher or lower 14/2.
  - In blind test `Should I…`, `Should…` and `Shou…` cannot be told apart.
- **Mute and *Mettre le son* buttons** sit on a screen nobody touches (quiz,
  buzzer, challenge, matchsticks, blind test). P3.

## Per game

- **Most likely, reveal.**
  - The vote rows (~62 px) run off the bottom: about 12 show at 1080p and 9 at
    720p.
  - `ul.scorers` holds 127 px of content in a **0 px** box, so the scorers are
    never shown.
- **Atlas, reveal.**
  - The distance labels on each line's midpoint pile into one smear. Real
    players guessing a small country cluster the same way the bots did.
  - `ul.said` scrolls in its box (about 21 of 32 rows). Distances are cut to
    `à…`.
  - Zoom controls are drawn on a screen with no input.
- **Inner clock, reveal.**
  - 32 rows at ~14 px, with figures at ~10 px, and most of them read "n'a pas
    appuyé".
  - About 16 rows show at 720p.
  - "Compte jusqu'à" is clipped by the card's band.
- **Estimate, reveal.**
  - The guess list is ~16 px at 1080p and 12 px at 720p, and `habitants` is
    cut.
  - At 720p the numbers themselves are cut (`1 05…`) and 18 of 31 guesses
    show.
  - The log-scale pawn chart is fine.
- **Petit Bac, round.**
  - 1080p lays out 7 columns and cuts 16 names. 720p lays out 5 and cuts 4,
    so the bigger screen loses more.
  - The category card above is mostly padding.
- **Slate, round.** At 720p `ul.progress` scrolls (851/541) and shows about
  20 of 32 rows. At 1080p all 32 fit, at ~14 px.
- **Reflex, round at 720p.** It shows a "Classement" that is alphabetical with
  no scores, cut at 18.
- **Blind test, round.** *Mettre le son*, *Lancer le son* and a red refusal
  banner stack ~140 px above the grid when the browser refuses autoplay, which
  a TV browser can do.
- **Challenge, reveal.** The challenge line is not repeated, and the left half
  of the screen is empty.

## Holds up at 32

- The "N réponses sur 32" pawn strip in every round.
- Every question card at both sizes.
- The buzzer's big pawn.
- Higher or lower's tally card.
- Estimate's log chart and timeline's year cards.
- The final winner block.

## Not reached by the run

These need the script extended before their verdict:

- The Petit Bac voting and reveal, and the slate reveal: the script never marks
  or votes, and those shots equal the round.
- Swatch, matchsticks, challenge, black square, reflex and inner clock reveals
  at full density: the bots scored nothing or almost nothing.
