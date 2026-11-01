# 60 — Home rows

**Done** 01/11/2026.

The front page put the host's press at the top, across from the code box,
acting on ticks a screen and a half below it, and stacked the five ready-made
lids one under the other on a phone: 3 830 pixels of page, 2 000 of them lids.
It now opens on rows a press launches from, and the press that launches the
ticked games sits under the ticks.

Three directions were drawn as full pages and compared; the second was kept.

## What the page is now

- **Masthead**: the wordmark, *Back to table K7PX* under it while that table is
  open, and the code box. No coral press.
- **Your line-ups** — absent until there is one. The saved evenings, each
  starred, then the tables this device played, latest first. A line-up both
  starred and played shows once, as the favourite, carrying its last table
  (*12 rounds played of 20*, *Played yesterday*). With plays and no star, the
  row ends on a socket that teaches the star.
- **Ready-made line-ups** — the five the app ships, as a row.
- **The shelf**, unchanged above its foot, and **the host's door** as that
  foot: sticky to the bottom of the screen while the shelf is on it, ruled and
  lifted only while it floats.

The look of each piece is in `apps/game/DESIGN.md` under *Box lid, shelf and
spines*.

## Rules, as settled

- **A recent table** (`packages/core/src/room/recent-tables.ts`,
  `melee:recent-tables`) is written by the console each time a round's answer
  goes up, never for a table that played none. One room is one recent however
  often it is written; a line-up played twice is kept at its latest play;
  eight at most.
- **A line-up is the same** when its entries, deals and round count are; the
  running order is not compared, since the room deals a fresh one.
- **The order is dealt once per visit.** A star pressed on the page keeps or
  forgets the line-up at once, but no lid moves until the next visit.
- **Starring a recent** keeps it as a saved evening under the name its lid
  shows: the ready-made's, or its games.
- **Opening a saved or recent line-up** goes the ready-made's way: the room is
  created on its games, and the console lays the line-up over the host's setup
  on its first lobby view (`HostArrival` carries the evening).
- **A refusal** shows beside the press that met it — under the door or under
  the rows — since the door is often off screen when a lid is pressed.

## Turned down

- **Drag and drop to reorder a row**: a row that moves under a press meant to
  open a table opens the wrong one, and the star already says which come
  first.
- **A third row of plays apart from the favourites**: it doubled the lids a
  host has to read past to reach the shelf, for a split nobody asked for.
- **The press kept at the top beside a second one at the foot**: two identical
  coral presses ask which one opens what.
