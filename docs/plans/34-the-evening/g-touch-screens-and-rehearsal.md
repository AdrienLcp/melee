# g — Big touch screens and rehearsal

**Goal.** The wall works on a 55–86" touch display, landscape and portrait,
read from across a room and touched by a standing crowd; then the whole
evening runs once on site.

## In the repository

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
