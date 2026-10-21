# g — Big touch screens and rehearsal

**Goal.** The wall works on a 55–86" touch display, landscape and portrait,
read from across a room and touched by a standing crowd; then the whole
evening runs once on site.

## In the repository — done 21/10/2026

What landed: past a short side of 1080px `html`'s font size grows with the
screen (`apps/game/DESIGN.md`, *Hierarchy*), so 4K is 1080p at twice the size;
the wall itself is in `e2e/choice-fits.spec.ts` (lobby, round, set, map, final
board, from 720p to 4K either way up) beside the room's screens at 4K, with a
`[scale]` test; a tablet hung upright puts the wall lobby's code and square on
one row. Every `hover` rule is an enhancement on a control a tap also reaches,
and the menu the wall hides when idle comes back on the first touch — a second
tap presses it, the way a video player's does. The map is drawn on the phones
only; the wall shows the country to place. Left for the venue: whether the
display's own browser keeps `useScreenAwake` (the Wake Lock API needs HTTPS,
which production has).

The brief it answered:

- `e2e/choice-fits.spec.ts` gains **3840×2160** and **2160×3840** (a 4K panel
  either way up) beside today's 1920×1080 and 1080×1920, for the wall's lobby,
  round, set, map and board.
- Touch targets on the wall sized for a finger at arm's length; no hover-only
  affordance anywhere the wall can answer.
- The wall holds the screen awake already (`useScreenAwake`); check a display's
  own kiosk browser keeps it.
- `impeccable` audit of every new screen from steps a–f at room distance.

## On site, with Adrien

- The real display and the host's phone on the venue's network: tap accuracy,
  the map's pinch on the panel, reconnection after the wall's Wi-Fi blinks.
- A dozen phones at once: scanning the code from across the room, joining,
  the atlas download time, a phone locking mid-round and coming back as itself.
- A whole evening's length: does the board finish around the last planned
  round? Does the room outlive the longest pause between dishes (decision 9)?

## Done when

Both 4K viewports green in the spec, and the rehearsal's notes diagnosed into
sessions — expecting, as the playtests of August did, that some notes report
things that already work and others point one layer away from the fault.
