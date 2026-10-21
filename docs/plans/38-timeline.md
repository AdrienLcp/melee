# 38 — Timeline

**Served 21/10/2026; screens owed.** Asked 21/10/2026. Five dated events dealt
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

## What the screens session owes

- The player's form: the five events as a list reordered by drag **and by
  keyboard** — react-aria's `GridList` with `useDragAndDrop` reorders both
  ways — and one button that sends the order. Nothing is sent until then.
- The console and wall stage: the events as dealt while the round is open,
  who has sent (the `answers` count), and on the reveal the true order with
  each year, each seat's pairs swapped and its pay.
- The player's reveal: their own order beside the true one, the swapped pairs
  shown rather than computed again.
- The shelf: a spine, a tagline and the door's description, then
  `shelvedGames`; the settings fold with the time per round.

## Decisions for Adrien to read

- Pairs rather than positions, and the tiers 3 / 2 / 1 for none, one and two
  pairs swapped.
- Five events a round, at least five years apart, fixed rather than a setting.
- One bank in both languages rather than a language setting like the quiz's.
