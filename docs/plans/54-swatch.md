# 54 — Swatch (colour memory)

**Nearly done** — step 1, the protocol's pieces and the rules in
`@melee/core/swatch/`, and step 2, the kind served end to end, landed
28/10/2026. Step 3, the screens, is owed.

A colour goes up on every screen for a few seconds — a dusty teal, a warm
ochre — then hides, and every seat rebuilds it on a picker. The server
measures how far each rebuilt colour is from the one shown, and the reveal
lays every seat's swatch beside it.

The thirteenth game, **everyone at once** in the catalogue's shapes
([`game-catalogue.md`](../game-catalogue.md)), the timeline's and the map's
family: one answer per seat, sent once, measured by the server.

Kind `swatch`, translation prefix `swatch.*`, answer mode `colour`. *Nuancier*
in French, *Shades* in English for now — step 2 owed the dictionaries a
`swatch.name` — and **not** *Swatch* on screen (a trademark): the id is
internal. The screens' session may rename it.

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
2. ~~**The kind, end to end on the wire.**~~ Done: `swatch` in `gameKinds`
   (not `shelvedGames`), mode `colour`, the verdict in the union,
   `colour_still_shown`, `server/domain/round/swatch-round.ts`, and
   `swatch-game.test.ts`, each assertion broken once. What reality settled:
   - `roundDurationMsOf` answers **show plus rebuild** for this game, so the
     round's clock is the whole round and no special case reaches
     `openPhaseDurationMs`; `showMs` is stamped on the round's content as it
     opens, like the reflex race's flip delay, and `hidesAt` is
     `startsAt + showMs`.
   - The player content is `colour` (from `startsAt` to `hidesAt`, then from
     the reveal — **not during the countdown**, so it is never up longer than
     the room was told), `hidesAt`, `revealedColours` and `yourColour` for a
     reload. The console's and the wall's arms are `{ kind: 'swatch' }`: the
     console reads the colour off the round like every seat.
   - `yourVerdict` is withheld until the reveal, as a matchstick move's is.
   - The server sends no frame *at* `hidesAt`: every screen hides on its own
     clock, and the next snapshot simply carries `null`.
   - The app holds only what compiling demanded — the name, the scoring line,
     the error, the mode's label and a `Palette` glyph.
3. **Screens and shelf.** Mostly landed 29/10/2026: `swatch` in
   `shelvedGames`, the spine (`--spine-swatch`, hue 210), `swatch.*` in both
   dictionaries, the page heads, the setup's two choices (shown 3/5/8 s,
   rebuild 10/20/30 s). `SwatchChip` (a paint chip: the colour on a card, its
   field inset rather than padded — a padding's percentage reads the
   parent's width), `SwatchShown`, `ColourPicker` (react-aria `ColorArea` +
   `ColorSlider` in HSB, holding its own `Color` so a grey keeps its hue),
   `useShownColour` (hides on the client clock), `SwatchRound` on the player
   and on `PlayingStage`, the reveal through the shared scoreline with a chip
   per row, nearest first (`colourDistanceOf` in `nearnessOf`). Verified muted
   at 390×780 and 1280×800: shown, hidden at `hidesAt`, picked, sent, revealed.
   **Still owed**: the paired wall and a seated console seen in a browser, the
   setup panel seen, and `pnpm validate` (e2e included).

## How to tell it is done

- A room opened on *Nuancier* from the front door shows a colour on the wall
  and on every phone, hides it on every screen at once after the set time, and
  takes one colour from each seat.
- A seat that reloads after the colour hid never sees it again.
- The reveal shows the colour beside every seat's, nearest first, and the board
  moves by what `pointsForColour` says.
- `pnpm validate` green.
