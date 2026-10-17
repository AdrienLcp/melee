# s — The setup and sharing the room

**Goal.** An evening adds three settings to a fold that already runs long, and
the room is shared the way Adrien's other apps share: a square to scan, a link
to copy, the phone's own share sheet. Starts with the `impeccable` skill.

## The setup

The leaflet already exists: `presentation/components/leaflet.tsx` on
`PopoverSheet` from `@adrienlcp/react-aria`, a sheet rising from the bottom
edge below the 900px split and a popover beside its trigger above it — what
the menu and the folded setup open since `1969c34`. Nothing new to build
there.

- The setup's leaflet groups its settings in react-aria `Disclosure`s: **The
  evening** (line-up, teams, board), **The round** (the game's own settings),
  **The room** (hold, everything no game answers). The group holding what the
  current phase can still change opens by default.
- Above the split, the popover holds a 30rem column; whether a side sheet reads
  better on a laptop console is decided in the `impeccable` pass, measured
  against the popover, not assumed.
- The host drives from a phone or a laptop indifferently: every control works
  by touch and by pointer, and nothing is gated on the device.

## Sharing

- **The square** — `room-invitation.tsx` draws it today; unchanged.
- **Copy the link** — beside today's copy of the code, through `copyText`
  from `@adrienlcp/browser`.
- **Share** — `navigator.share` with the link, shown only where the browser
  offers it. `arbor` and `list` each carry their own copy
  (`infrastructure/browser.ts`, `infrastructure/share.ts`), so this is the third
  consumer: the helper goes to `@adrienlcp/browser` first (rules in
  `C:/git/toolkit/bricks.md`) and lands here as a version bump.

## Done when

On a 390px phone and a 1440px laptop, muted, the host opens the setup, finds
Teams in its group, copies the link and — on the phone — opens the native
share sheet; a player opening the copied link lands on the join form.
