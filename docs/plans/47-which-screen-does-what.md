# 47 — Which screen does what

**Three steps of four** — steps 1 and 2 landed 24/10/2026, step 3 the same night. Asked 24/10/2026. Directions approved by Adrien the same night, from the pages
in `.impeccable/directions/screens-roles/` (git-excluded). The board stays the
wall's; a room without one stops losing it, and the console says, once and in
one place, what each screen is for — **never suggesting a second screen is
needed**: one device can run everything.

## Step 1 — the player view says whether a wall is there

`isWallConnected` was the host's alone (`hostRoomViewSchema`). It moves to the
base view beside `isHostConnected`, so every role reads it — the wall's own
view says `true` — with no version bump: a field an old client ignores. The
server passes it through `toBaseView`.

## Step 2 — a room with no wall draws the board on every phone

Today a player's reveal shows `YourTrackStrip`: seven cases around the own
pawn, which is enough beside a wall drawing the whole race and nothing like
the race without one. With no wall, the reveal draws **the ribbon** instead:

- the whole track on one line, cases at full size (4rem), scrolling
  sideways, opened centred on the own pawn;
- *Recentre* appears in the *Square N of M* row only once the own case has
  left the view, and scrolls back to it (instantly under reduced motion);
- the ends fade where the track runs on past the view;
- one line under it: *You lead, N squares ahead* · *Level at the front* ·
  *3rd of 6 · Owls lead, 4 squares ahead*.

With a wall, the strip stays as it is. The lobby keeps the strip.

— cut here: steps 1 and 2 committed, `pnpm validate` green, seen muted —

## Step 3 — the console's *Room* tab

The side panel gains a *Room* tab drawing the room from above as a selector
(`f-salle.html`): the room's screen (dashed while none is paired), the table
with the others, and the host's own row — *Your seat* and *This screen*,
marked *Here*. A pick rings the face and underlines it, no box.

- *This screen*: "This screen runs the room. To run it from your phone, scan
  this code" — the existing hand-over (`HandOverDoor`), its QR inline.
- *The room's screen*, none paired: pair a TV by its code, or *Make this
  screen the room's* — the same hand-over, QR inline (wide only). Paired:
  unpair.
- *Your seat*: take or leave it.

The lobby keeps one line, with no wall only: *Everything is set in Room*.

## Step 4 — the board's shape follows its case size

One rule for the wall's `BoardTrack` and a wide console with no wall
(`g-u-console.html`): **one line along the top** while `width / cases ≥ 56px`
(height capped at 88), else the U whose rows give the larger smaller side if
that side is ≥ 56, else the **closed loop** (perimeter ≥ cases + 1, one empty
cell between *Finish* and *Start*, bottom left). Measured at 1440 × 900 with
the panel: 10 → line, 30 → U, 60 → loop. On the console it stands around the
stage, the panel outside it, and only with no wall on a wide screen.

## What landed

- **Steps 1 and 2.** `isWallConnected` sits on the base view; the wall's own
  view says `true`. `TrackStrip` takes `reach: 'whole'` — the scroller, the
  fades on its edges and *Recentre* — and a `children` line, which
  `YourTrackStrip` fills with the gap to the front (`trackLeadOf`, in
  `packages/core/src/board/track-lead.ts`). The rank is not repeated there:
  the reveal already says *3rd of 6* above it. The scroller takes no focus —
  the cases are `aria-hidden`, the position is written in the row above, and
  *Recentre* is a real button.
- In passing: the console's stubbed views in `e2e/choice-fits.spec.ts` still
  carried `nextChallenge` from before plan 44 renamed it `challengeHand`, so
  every console and room case there had been failing on `main` since.
- **Step 3.** The Room tab's scene is `features/host/room-scene.tsx`; the
  seat moved there from Players, and the volume from the tab's foot into
  *This screen*. Two departures from `f-salle.html`: the hand-over stays
  folded (`HandOverDoor`), because the tab's default pick with no wall would
  otherwise put the room's token on the screen the room is facing; and
  *unpair* needed a frame that did not exist — `host.dismissWall`, a fatal
  `wall_dismissed` to the wall, which goes back to `/wall`. The pairing form
  left the menu for `presentation/components/wall-pairing-form.tsx`, shared by
  both. The lobby's pointer opens the tab through `useOptionalPanelTabOpener`
  (`host-panel.tsx`).
