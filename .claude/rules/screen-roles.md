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
  the next-round press — sits in the first viewport.

## When the wall runs out of room

The wall fits by giving things up, in this order, before it ever scrolls:

1. the movement stamp beside a row (↑2, ↓1) — the standings travelling to
   their new places already says it;
2. the round gain beside a row (`+35`) — the round's podium says who scored;
3. the ready mark, last — it starts the next round, and the table needs to see
   who is holding it up.

Then rows shrink over the height budget (`standingsRowsOf`), then columns
change: one at 9:16, up to three at 16:9. The round's podium drops from three
to the first alone ("+ N autres") to the tally alone. The other screens may
use the same order to stay legible.

## The shapes every screen is checked at

16:9 and 9:16, small and large, for each role — the wall included at 9:16,
which is rarer than a television but real. At `MAX_PLAYERS_PER_ROOM` seats with
long names, both palettes, French (it runs longest). `e2e/choice-fits.spec.ts`
holds the viewport list and the overflow checks; a new screen joins it.
