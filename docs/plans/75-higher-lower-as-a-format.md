# 75 — Plus ou moins as a format of Le juste chiffre

**Done** 19/11/2026 — one session.

The shelf had two cards for one bank: _Le juste chiffre_ (estimate a number)
and _Plus ou moins_ (pick the larger of a pair). They became one card. A host
opens _Le juste chiffre_ and picks its **format** — _Estimer_ or _Plus ou
moins_ — in the game's settings, like Atlas' direction.

## Shape, as settled

- **Two kinds stay, one card.** `estimate` and `higherlower` share the
  quantity bank and nothing else: the round, the answer mode (`number`,
  `pairs`), the pay, the deck, the clock range and the remembered setup all
  differ. Folding them into one kind would have put a mode switch inside every
  one of those, so the format *is* the kind, and the shelf hides it:
  `@melee/core/room/shelf-cards` maps a format to its card (`cardOf`) and
  lists `shelfCards` — `shelvedGames` minus formats. `shelvedGames` keeps
  `higherlower`: it still means *served with screens*, which the lobby's
  pitch and the player's _up next_ guard on.
- **What reads the shelf reads `shelfCards`**: the home shelf and its ticks,
  the lobby's _add a game_ list (an entry of either format counts under the
  one card), the prerendered front doors. `/fr/higherlower` redirects to
  `/fr/estimate`; a stored tick or a remembered evening naming `higherlower`
  ticks the estimate. A remembered `higherlower` setup and a saved line-up
  holding one still parse unchanged — the kind exists.
- **The switch** (`inEstimateFormat` in `@melee/core/estimate/estimate-format`)
  carries the level and the table's country over, and takes the other
  format's own clock and every topic. The panel writes the moved game into
  the entry `lineUpAt` points at, because the server refuses a frame whose
  game and entry disagree, and narrows the mode to what the format offers.
- **One look.** The entry's lid always names and draws the card; the format
  control under it says which way it is played. `--spine-higherlower` and its
  edge and ink alias the estimate's, so a row, a round and the switch never
  change colour. Round screens still call a pairs round _Plus ou moins_: that
  is what the table is playing.
- **Settings stay mounted across a switch**: level and clock are one control
  for both formats (the clock's options change under the same thumb), and the
  estimate's topics fold away rather than unmount.
- Translation prefix `higherlower.*` stays — the kind owns it.

## Seen

Muted, a console and a seat: the switch filmed both ways (the lid still, the
topics fading then folding), a pairs round and an estimate round played
end to end across a switch between two rounds, the panel at 390 px, and the
home shelf without a _Plus ou moins_ card.
