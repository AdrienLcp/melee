# 38 — Timeline

**Done 21/10/2026.** Asked 21/10/2026, served and drawn the same day. Five dated events dealt
at once; each player puts them in order on their own screen, and the wall shows
the true order on the reveal with each year.

## What was built — the server

- **A game kind, `timeline`, not shelved.** `gameKinds` names it and
  `shelvedGames` does not, as every game spent a stage. Its settings are
  `roundDurationMs` alone (15 to 120 s, 45 by default: five rows are dragged
  before anything is sent), eight rounds by default.
- **An answer mode of its own, `order`.** The answer is neither a pick nor a
  line nor a place, so `answerModes` grew a fifth member and the game narrows
  the room to it, as the map does to `point`. `player.answer` carries
  `{ kind: 'order', eventIds }`, every event once, earliest first — one shot,
  like a pick; a second is `already_buzzed`, a short or foreign one
  `invalid_message`.
- **Scored by pairs, not positions** — the plan left it open. Positions punish
  one event in the wrong place twice over: moving the earliest to the end
  leaves every position wrong, where it is four pairs. The verdict is
  `{ kind: 'order', swappedPairs }` and `core/timeline/order-pay` prices it in
  tiers like the map's distances: none swapped 3 `POINT`s (the typed answer's
  price), one 2, two 1, more nothing. Five events dealt at random already
  average five pairs swapped, so a shuffle pays about a sixth of a point on
  average and a reversed order nothing. The clock adds on top, capped by the
  tier, as everywhere.
- **The bank** is `apps/server/src/infrastructure/questions/timeline-bank.json`,
  214 events written by hand in both languages at once — history 63, science 34,
  tech and games 25, film 29, music 26, sport 19, culture 18 — each dated to a
  year nobody argues about, a release dated by its first anywhere (the
  PlayStation is 1994, its Japanese launch). An event whose year is disputed —
  a film in production for years, a game public in one year and finished in
  another — was left out rather than dated by a coin toss. Labels ride the wire **in every
  locale** (`labels: { en, fr }`), so each screen reads its own: a phone set
  to English at a French table is still playing.
- **The deal** (`core/timeline/deal`) takes five unplayed events at least
  `MIN_YEARS_APART` (five) from one another, greedily over a shuffle; the bank
  deals well over twenty rounds before it cannot.
- **Who sees the years.** The public arm carries the events with no year and
  `revealedEvents` (earliest first, with years) from the reveal; the host arm
  `datedEvents`, `null` while the console holds a seat — nobody judges, so a
  seat is offered; the wall the kind alone. `timeline-game.test.ts` checks a
  player's and the wall's whole transcript for a year, and was seen red with
  the reveal guard removed; the core suites were seen red with the pair count
  inverted.
- The app names it (`timeline.name`, `timeline.scoring`, `host.answerMode.order`)
  and gives it the `History` glyph, so every exhaustive switch compiles. No
  screen draws it yet.

## What was built — the screens

- **An event is a printed card** (`TimelineCard`): the year slot on top, a
  dashed empty slot until the reveal prints the date in it, the name in the
  reader's own locale under it. `TimelineStrip` lays cards down two ways —
  `dealt`, side by side in no order, and `ordered`, hung off one line with a
  dot each, across a box 40rem wide or more and down a narrower one.
- **The player's form** (`TimelineAnswer`, over `TimelineOrderList` in
  `presentation/components`, which wraps react-aria's `GridList` and
  `useDragAndDrop`): the five cards between *earliest* and *latest*, each with
  a grip — dragged by a pointer, a finger or the keyboard through the drag
  button — and two arrows that step it one place, because a hand that has
  never dragged anything on a screen finds a press first. One coral press
  sends the order; the sent order stays on the line, years still empty,
  until the reveal. A reload after sending says the order is in and draws
  nothing, since no screen is told what anyone sent. A seated console and the
  wall answering for a team draw the same form on the stage.
- **The console and the wall** put the line *which came first?* on the round
  card and the five cards dealt across the stage under it, with the count of
  who is in.
- **The reveal** strings the cards along the line with their years on the
  console and the wall, every seat's pairs swapped beside its name, fewest
  first (`nearnessOf` and `revealedInOrder` read a swapped-pair count where
  the map reads kilometres). A player reads their own order back with the
  years on it — what is out of place shows without anything recounted — and
  the pairs swapped beside the title; a seat that sent nothing reads the true
  order. The order comes back from the revealed answer's line, joined by
  `TIMELINE_ORDER_SEPARATOR` in `protocol/timeline.ts` on both ends.
- **The shelf**: a bronze spine, `oklch(46% 0.09 100)`, a tagline and the
  door's description, `shelvedGames`, the document heads, and the time per
  round in the settings fold (30, 45 or 90 s).
- Seen muted through a Playwright script at 1280×800 and 390×844, light in
  English and dark in French: the shelf, the fold, the dealt stage, an arrow
  and a drag reordering the player's cards, the sent order, and the reveal on
  the console (wide and narrow) and the player. A paired wall and a seated
  console were not seen.

## Decisions taken

- Pairs rather than positions, and the tiers 3 / 2 / 1 for none, one and two
  pairs swapped.
- Five events a round, at least five years apart, fixed rather than a setting.
- One bank in both languages rather than a language setting like the quiz's.
- Arrows on every card beside the drag, rather than the drag alone.
- The player's reveal shows their own order with the years rather than the
  true order, which the room's screen carries.
