<!-- cspell:disable — quotes the French screens verbatim -->

# A full table — the direction to settle first

The first of five handoffs from the 32-seat audit (30/10/2026). **Read this
one, debate it with Adrien, and only then open `crowd-02` to `crowd-05`.** Every
surface fix depends on the answers here, and `impeccable` runs first: this is
layout work on every screen.

## What was done

- `MAX_PLAYERS_PER_ROOM` went from 24 to **32** (`packages/protocol/src/room.ts`).
  Nothing in the history justified 24.
- Every game was played at 32 seats, through lobby → round → reveal → final.
  It ran in two modes: with a wall, and without one (the console is then the
  room's screen). The views captured were:
  - the console at 1440×900 and at 390×844;
  - a player at 390×844 and at 360×640;
  - the wall at 1920×1080 and at 1280×720.
- The driver is `handoffs/crowd-simulation.mjs`. To run it:
  `OUT=<dir> WALL=1|0 SEATS=32 node handoffs/crowd-simulation.mjs <game…>`
  against `pnpm dev`. It writes one PNG per screen and phase, and a
  `report-*.json` holding the page overflow and the clipped and scrolling
  elements of each shot.
  - **Room and wall creation share a limit of 10 a minute**
    (`ROOM_CREATION_LIMITER`). The script spaces games 15 s apart and costs two
    creations per game with a wall, so run one chain per mode at most.
- Result: **no screen breaks horizontally anywhere, and nothing crashes.** The
  damage is vertical and informational. Lists of 32 overflow fixed cards, names
  and answers are cut to a few letters, and standings scroll inside the wall.
  The details are in `crowd-02` (wall), `crowd-03` (console) and `crowd-04`
  (player).

## Adrien's principles, as he stated them

- **The wall is a presentation on a giant screen**, read by everyone across a
  big room. It never scrolls, and it does not have to show every detail: a
  top 10 is a candidate for the standings.
- **A player's device may be navigated and scrolled.** The details live there:
  full standings, everyone's answers. The exceptions are the answering screens
  (a question with four choices, and a few others), which must fit in `100svh`.
- **The console beside a wall shows the host the details** that the wall
  leaves out.
- **The console without a wall is the wall, the control panel and possibly a
  seat at once.** It has to hide the right things at the right moment, in menus
  or otherwise.
- **One seat per person stays the model.** A table of four sharing one phone
  is a fallback the players can already choose, never the recommendation.
- **Raise the cap past 32 only while performance stays perfect**, and stop
  where it starts to degrade (`crowd-05`).

## Questions to settle with Adrien before building

1. **The wall's standings.**
   - Option A: a top N at two to three times today's type (13 px today, which
     nobody reads across a room).
   - Option B: a top N plus "and 22 others", whose own rank each player reads
     on their device.
   - What N? It is 10 at 720p if the type grows enough to be read.
2. **The wall's "who said what" reveal** (quiz, blind test, timeline, higher or
   lower, atlas, estimate).
   - At 32 the per-player grid cuts both names and answers.
   - Proposal: show **a tally per answer** (higher or lower's top card already
     does this and reads well) plus **who scored**, and move the per-player
     detail to the devices and the console.
   - Does the room lose anything it cares about?
3. **The wall's lobby.**
   - The rules paragraphs are illegible at distance and push the name grid
     off-screen: 8 players are invisible at 720p.
   - Proposal: drop the prose and let the grid compress (smaller cards, more
     columns) as seats fill.
4. **The console without a wall, during a round.**
   - The host panel (~400 px, with × remove buttons on every seat) stays open
     on the screen the table reads.
   - Should it fold away while a round plays and come back between rounds?
     Behind a menu, or as a drawer?
   - The phone-sized console without a wall is already the best console, with
     its tab bar pinning *Manche suivante*. Is that the model for the laptop?
5. **Where the console beside a wall shows the details.**
   - Its reveal lists overflow onto *Manche suivante* in inner clock and most
     likely.
   - A scrolling detail panel with the next-round control pinned outside it is
     the obvious shape. Confirm it.
6. **Whether a player's own row is always marked.** Atlas outlines it; inner
   clock and most likely do not. With 32 rows, "where am I" is the first
   question.

## Order once settled

`crowd-02` wall → `crowd-03` console → `crowd-04` player, each in its own
session, each re-run with the script at 32 and seen in a browser, muted
(`docs/browser-driving.md`). `crowd-05` is independent and can go in parallel.
Delete each file once nothing is left in it.
