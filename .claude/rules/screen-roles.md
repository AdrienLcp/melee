---
description: What each screen is for, which may scroll, what gives way first when room runs out, and the shapes every screen is checked at
paths:
  - "apps/game/src/features/host/**"
  - "apps/game/src/features/wall/**"
  - "apps/game/src/features/player/**"
  - "apps/game/src/presentation/components/**"
  - "e2e/**"
---

# Screen roles

Three roles, each with its own contract. The **role** decides, never the
device: a phone may be the host, a laptop a player.

| Screen | Is | Touched? | Page scroll |
|---|---|---|---|
| **Wall** | the room's shared screen, read by everyone from up to four metres | never | **never**, at any shape |
| **Console, no wall** | the room's shared screen *and* the host's controls | pointer or touch | allowed |
| **Console, beside a wall** | the host's control panel: every figure and every setting, read by one person | pointer or touch | allowed |
| **Player** | one person's screen, read at 40 cm in glances | touch | allowed |

Every screen may scroll inside a box made to scroll — the menu, the setup's
side panel, a popover sheet.

Two floors hold on every role:

- **An answering screen never scrolls**: a question and its choices, the floor,
  a buzzer — anything pressed against the clock — sit in the viewport, on a
  player and on a seated console alike (`DESIGN.md`, *The No-Scroll Rule*).
- **A console with no wall is still what the room reads**: where it scrolls,
  what the room is looking at — the round's podium, the head of the standings,
  the next-round press — sits in the first viewport. Below 45rem tall, a table
  past eight seats keeps the score track to one line that swipes sideways.

A player's reveal scrolls, and its first viewport owes the answer, the
round's block (*This round*: the seat's own result and the podium), the hold
and the Ready press, all in the flow — never positioned over a row. The
overall standings come after them, at a fixed legible size, and the page
scrolls to the last row; nothing divides the screen by the room's size. Lying
down, the standings take a column beside the round instead.

## Two blocks on every reveal

The round and the game are never one row. *This round* (`round.thisRound`)
holds every figure the round alone paid — the answer, the podium with round
places, a seat's own `+35` — in filled pieces; *Overall standings*
(`round.overallStandings`) holds rank, pawn, name, ready mark, case, total
and the movement stamp, in ruled rows, and no figure of the round. Each opens
on the same ruled heading (`SectionHeading`), on every role.

## When the wall runs out of room

The wall fits by giving things up, in this order, before it ever scrolls:

1. the movement stamp beside a row (↑2, ↓1) — the standings travelling to
   their new places already says it;
2. the ready mark, last — it starts the next round, and the table needs to see
   who is holding it up.

Then rows shrink over the height budget (`standingsRowsOf`) down to the
`--text-xs` floor, then a list past twelve seats takes two columns, filled
top to bottom — lying down and on a narrow wall, never at 9:16, which has the
height for one. The round's podium drops from three to the first alone
("+ N autres") to the count alone, and the tally is cut in whole chips
(`useWholeChips`), never scrolled. The other screens may use the same order
to stay legible.

## When an answering screen runs out of room

A player's screen and a seated console, from countdown to buzzed, fit by
giving things up in this order, never by scrolling the page:

1. decoration and repeats — the answered pawns, a preview chip the thumb
   already shows, the header's copy of a turn the stage shows;
2. secondary text — a hint, a note, the category, the *latest* end of a
   timeline (never the *earliest*, which says the direction), a label that
   becomes the field's placeholder;
3. size, down to `--text-xs` and a 44px press — the send press drops from
   large to the control height, a board (sticks, a map, the picker's square)
   shrinks to a floor of its own before any press leaves the screen;
4. layout — lying down (`framed.lying-down`, 13/10) the question takes one
   side and the answer the other; a list of seats takes the columns its
   height allows (`seatColumns`).

Only a list that no clock presses may then scroll **inside its own box**:
Petit Bac's sheet and its vote, the slate's tile strip and *Toute ta
feuille*. The letter, the clock, *Stop*, the field and Précédent/Suivant stay
outside that box. Choices, a pair, the five events and the most-likely seats
never scroll — 24 seats at 320 wide end a long name on an ellipsis at the
lines its row holds instead.

**A keyboard is half the screen.** `--shown-height` (the visual viewport, for
an engine that overlays the keyboard) is the frame's height, and with a field
focused the question, the field and the send press still sit in it: at
320×284 the seated console hides its tab bar until the keyboard goes down.
`DESIGN.md`, *A keyboard is half the screen*, holds the engines.

## The shapes every screen is checked at

16:9 and 9:16, small and large, for each role — the wall included at 9:16,
which is rarer than a television but real. At `MAX_PLAYERS_PER_ROOM` seats with
long names, both palettes, French (it runs longest). `e2e/choice-fits.spec.ts`
holds the viewport list and the overflow checks; a new screen joins it.
