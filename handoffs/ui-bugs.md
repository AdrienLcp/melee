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
