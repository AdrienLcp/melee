# 54 — Swatch (colour memory)

**Half done** — step 1, the protocol's pieces and the rules in
`@melee/core/swatch/`, landed 28/10/2026. Steps 2 and 3 are owed.

A colour goes up on every screen for a few seconds — a dusty teal, a warm
ochre — then hides, and every seat rebuilds it on a picker. The server
measures how far each rebuilt colour is from the one shown, and the reveal
lays every seat's swatch beside it.

The thirteenth game, **everyone at once** in the catalogue's shapes
([`game-catalogue.md`](../game-catalogue.md)), the timeline's and the map's
family: one answer per seat, sent once, measured by the server.

Kind `swatch`, translation prefix `swatch.*`, answer mode `colour`. *Nuancier*
in French. The English name is the screens' session to settle, and is **not**
*Swatch* on screen (a trademark): the id is internal.

## Rules, as settled

- **One colour a round, drawn by the server** in OKLCH: lightness 0.45–0.85,
  hue uniform, chroma from 0.08 to the most sRGB holds at that hue and
  lightness, a pairing that cannot reach 0.08 drawn again
  (`drawSwatchColour`). Too dark reads as brown or navy and too light as a
  pastel — a word to remember rather than a colour — and a near-grey would
  make sending grey the right answer.
- **It travels as sRGB hex**, `#rrggbb` (`colourHexSchema`): what a screen can
  show is what a seat can answer.
- **Shown, then hidden.** `showMs` 2–10 s, **5 s by default**: two is a glance
  a table still calls fair, ten is long enough to name the colour. Then
  `roundDurationMs` 10–60 s, **20 s by default**, to rebuild it.
- **The colour is sent to every screen before it hides**, and that is
  accepted rather than defended: a phone keeping it is no worse than a photo
  of it. The round carries `colour` and `hidesAt` (a server timestamp every
  screen schedules on its own clock offset, the reflex race's `flipsAt`
  argument), and every snapshot after `hidesAt` carries `colour: null`, so a
  screen arriving or reloading late never sees it. The wall shows it big when
  there is one.
- **An answer before `hidesAt` is refused** with its own code
  (`colour_still_shown`, non-fatal): rebuilding a colour while looking at it is
  copying it.
- **One shot per seat**, like a pick: a picker is for adjusting before sending.
- **The pay** (`pointsForColour`): the distance in OKLab, the whole typed
  price (3 `POINT`s) within 0.02 — about the smallest gap an eye sees side by
  side — falling linearly to nothing at 0.11. Measured on 20 000 drawn
  colours: a mid grey sent every round pays in about one round in ten, a
  sharp memory (hue within 5°) lands around 0.02, a fair one (within 12°)
  around 0.05 and is paid about 1.7 points, a loose one (25°) around 0.09.
- **No speed bonus.** Memory fades with time, so a slow answer already pays
  itself less; the clock on top would pay rushing a colour nobody looked at
  twice, and the distances already separate every seat. `isPaidForSpeed`
  answers `false` for the `colour` verdict, like a black-square sheet.
- **Exact** (`isExactColour`, within 0.02) is what `isFullyBanked` reads.
- **The character rubric** — *Shrek's green* — **does not ship here.** It is a
  hand-set bank where every row is an argument, and the catalogue already
  costs it a session of its own.

## The shape, as decided

- `colourVerdictSchema` (`distance`) is defined in `scoring.ts` beside the
  others and **joins `verdictSchema` in step 2**, where the exhaustive
  switches it breaks are fixed in the same commit.
- Capabilities: `answerModes: ['colour']`, `makesSound: false`,
  `playsAloud: false` (the answer *is* a screen), `playsDuels: true`,
  `servesItsOwnContent: true`. Judged by the server, never by the host.
- The picker is react-aria's `ColorArea` (saturation × brightness) over a
  `ColorSlider` (hue), wrapped in `presentation/components/` like every other
  primitive. No new library. It opens on a neutral mid grey, never on the
  answer or on a random colour that could land close by luck.
- The reveal: the shown colour as a large field, every seat's swatch beside it
  in order of distance, each with its points.

## Steps

1. ~~**Protocol and core.**~~ Done: `protocol/swatch.ts` (hex, show bounds),
   `colourVerdictSchema`, `core/swatch/` — `oklab.ts` (conversion, distance),
   `colour-pay.ts`, `draw.ts`, each tested and broken once.
2. **The kind, end to end on the wire.** `swatch` in `gameKinds` (not yet
   `shelvedGames`), its settings arm and default, mode `colour`, the verdict in
   the union, `round.content` arms for every role, `player.answer`'s `colour`
   arm, `colour_still_shown`, capabilities, the server's round (draw, hide,
   measure, settle), and a socket suite — the anti-cheat transcript included:
   no frame after `hidesAt` carries the colour.
3. **Screens and shelf.** Player picker, wall and console rounds, reveal,
   lobby settings, the spine, `swatch.*` strings in both dictionaries,
   `shelvedGames`. Verified muted in a real browser, phone width and wall.

## How to tell it is done

- A room opened on *Nuancier* from the front door shows a colour on the wall
  and on every phone, hides it on every screen at once after the set time, and
  takes one colour from each seat.
- A seat that reloads after the colour hid never sees it again.
- The reveal shows the colour beside every seat's, nearest first, and the board
  moves by what `pointsForColour` says.
- `pnpm validate` green.
