# Small UI bugs

Small things Adrien saw on screen. One session; strike each item as it lands
and delete this file once none is left. Each fix is seen in a real browser,
muted (`docs/browser-driving.md`).

## 1. The wall pairing button spins forever after the second wall

> I typed the codes of two walls, and the loading button spins forever after
> the second one.

**Cause:** `WallPairingForm` (`apps/game/src/presentation/components/wall-pairing-form.tsx`)
kept `isPending` on after a success (`outcome === 'paired'`). The first pairing
swaps the Salle panel to its "another wall" branch — a fresh form — so the bug
only shows from the second wall on.

**Fixed, not yet seen:** `isPending={outcome === 'pairing'}` is committed with
this file. Still to do: open a room, open `http://localhost:5273/wall` in two
tabs, pair both from the console's *Salle* tab (the room's screen card), and
check the button comes back after the second; decide whether a success wants a
check glyph in the button's `icon` slot (`impeccable` first).

## 2. A stripe down the right edge of the wall

> On the walls I think there is a gap on the right, probably
> `scrollbar-gutter: stable`? There will never be a scrollbar on that screen.

**Fixed in `d57fe60`, half seen:** `html:has(.wall-page)` and
`html:has(.wall-pairing-page)` set `scrollbar-gutter: auto`. The computed value
was checked on the pairing screen only, in a headless browser with overlay
scrollbars, so the stripe itself was never seen either way. Still to do: look at
a *paired* wall mid-game in a browser with classic scrollbars (Windows Chrome,
headed) and confirm the stripe is gone.

## 3. Black square's reveal collapses — and an audit of the same state elsewhere

> Big UI problem when I press "give the answer" in black square. Audit the
> other places where this state could happen too.

Screenshot: `handoffs/black-square-reveal.png` (desk width, round 28 of 40, a
line-up with a quiz planned next). After `host.reveal`, the stage:

- keeps the theme on top and a huge empty field where the grid was;
- crushes the grid's cells into three flat slivers along the bottom edge, their
  labels unreadable;
- pushes the black word's card past the stage's bottom-right corner, its
  hint and "nobody fell in" spilling out over the next-round card below.

So the reveal's content no longer fits the box the stage gives it: likely a
grid row sized for the open round that the reveal's taller cells (answers
written in) overflow, or a fixed-height stage with `overflow: visible`. Find
which screens show it (host stage, wall, player — check all three) and fix it.

**Then audit**, before closing the item: every game's reveal and every phase
change that swaps what a stage holds for something taller or wider —
especially the grid- and card-based games (black square, petit bac, slate,
timeline, higher or lower, estimate, most likely, atlas). For each: desk and
phone widths, a long answer (the longest the bank holds), the most items the
game deals, a line-up with a next-round card under the stage. List what was
checked and what was fixed here, with screenshots, and turn any rule worth
keeping into `apps/game/DESIGN.md` or `.claude/rules/sass-architecture.md`.
`impeccable` first.
