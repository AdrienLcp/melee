<!-- cspell:disable — quotes the French screens verbatim -->

# How far past 32 seats the room can go

Independent of the screen work. Adrien's rule: **raise the cap only while
performance stays perfect, and stop where it starts to degrade.** Nothing here
is built yet.

## What was measured (30/10/2026, local `wrangler dev`, indicative)

The test was a quiz round in `choice` mode, with every seat answering at once.

| Seats | Burst → reveal | Received per screen per question | Largest snapshot |
|---|---|---|---|
| 8 | 59 ms | 22 KB | 4 KB |
| 16 | 121 ms | 64 KB | 7.5 KB |
| 24 | 446 ms | 127 KB | 11 KB |
| 32 | 449 ms | 204 KB | 13 KB |

During the full run, the biggest snapshot at 32 was 15–16 KB, in timeline,
atlas and blind test.

**Why it grows like this.** Every answer triggers a `room.updated` to every
socket, and a snapshot grows with the table (~1.6 KB plus ~0.4 KB a seat). The
bytes a question costs are therefore about `seats² × 0.2 KB` per screen, and
`seats³` for the room as a whole. The two table rows at 24 and 32 are close
because another run shared the machine. Re-measure on a quiet machine before
trusting the curve.

**Extrapolated.** At 64 seats: ~1.6 MB per screen per question, ~100 MB pushed
by the room per burst. At 100 seats: ~4 MB and ~400 MB. A bar's Wi-Fi or 4G
will not carry that.

## The risk that matters is fairness, not bandwidth

A room handles one message at a time.

- **Buzzes.** A buzz that arrives during an answer burst waits behind every
  broadcast before it is stamped. The order between buzzes is kept, so the
  buzzer stays fair.
- **Reflex.** The race measures press time from `flipsAt`, and every press
  broadcasts to every seat. Queued work therefore adds directly to the later
  presses' reaction times. **Measure this at 32 first:** have 32 sockets press
  at a controlled spread after the flip, and compare stamped against sent.

## What raising the cap would need

1. **Coalesce broadcasts.** Send one snapshot per ~50–100 ms window rather than
   one per frame. This keeps the "whole snapshot, never a delta" rule and cuts
   a burst from N broadcasts to a handful.
2. **Encode once per role where the views are equal.** Player views differ by
   `youId` and the seat's own verdict, so check how much of the view is
   per-seat before assuming.
3. **Stamp on arrival before any work.** Read the clock first in the message
   handler, so a queue never delays a stamp.

Then re-run the table above at 32, 48 and 64, together with the reflex
measurement, and pick the largest size where:

- the reveal still lands under ~150 ms;
- a reflex stamp drifts by under ~10 ms;
- a screen receives under ~250 KB per question.

The screens are a separate ceiling: `crowd-02` shows the wall is already at its
limit at 32 until its standings change.
